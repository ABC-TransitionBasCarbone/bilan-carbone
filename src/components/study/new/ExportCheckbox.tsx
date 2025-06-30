import { Select } from '@/components/base/Select'
import ControlModeChangeWarningModal from '@/components/study/perimeter/ControlModeChangeWarningModal'
import { FullStudy } from '@/db/study'
import { useServerFunction } from '@/hooks/useServerFunction'
import { clearInvalidCharacterizations } from '@/services/serverFunctions/study'
import { Checkbox, FormControl, FormControlLabel, MenuItem } from '@mui/material'
import { ControlMode, Export } from '@prisma/client'
import { useTranslations } from 'next-intl'
import { Dispatch, SetStateAction, useMemo, useState } from 'react'
import styles from './ExportCheckbox.module.css'

interface Props {
  id: Export
  study: FullStudy | null
  values: Record<Export, ControlMode | false>
  setValues: Dispatch<SetStateAction<Record<Export, ControlMode | false>>>
  disabled?: boolean
}

const ExportCheckbox = ({ id, study, values, setValues, disabled }: Props) => {
  const t = useTranslations('study.new')
  const tExport = useTranslations('exports')
  const { callServerFunction } = useServerFunction()
  const [showWarning, setShowWarning] = useState(false)
  const [pendingControlMode, setPendingControlMode] = useState<ControlMode | null>(null)

  const hasCharacterizations = useMemo(
    () => study && study.emissionSources.some((source) => source.caracterisation !== null),
    [study],
  )

  const handleControlModeChange = (newControlMode: ControlMode) => {
    const currentControlMode = values[id] as ControlMode

    if (hasCharacterizations && currentControlMode && currentControlMode !== newControlMode) {
      setPendingControlMode(newControlMode)
      setShowWarning(true)
    } else {
      setValues({ ...values, [id]: newControlMode })
    }
  }

  const confirmControlModeChange = async () => {
    if (pendingControlMode) {
      if (!study) {
        setValues({ ...values, [id]: pendingControlMode })
      } else {
        await callServerFunction(() => clearInvalidCharacterizations(study.id, pendingControlMode), {
          onSuccess: () => {
            setValues({ ...values, [id]: pendingControlMode })
          },
        })
      }
    }
    setShowWarning(false)
    setPendingControlMode(null)
  }

  const cancelControlModeChange = () => {
    setShowWarning(false)
    setPendingControlMode(null)
  }

  return (
    <div className={styles.container}>
      <FormControlLabel
        className={styles.field}
        control={
          <Checkbox checked={!!values[id]} className={styles.checkbox} disabled={id !== Export.Beges || disabled} />
        }
        label={
          <span>
            {tExport(id)}
            {id !== Export.Beges && <em> ({t('coming')})</em>}
          </span>
        }
        value={!!values[id]}
        onChange={(_, checked) => setValues({ ...values, [id]: checked ? ControlMode.Operational : false })}
      />
      {values[id] && (
        <div className={styles.field}>
          <FormControl fullWidth>
            <Select
              value={values[id]}
              onChange={(event) => handleControlModeChange(event.target.value as ControlMode)}
              disabled={disabled}
            >
              {Object.keys(ControlMode).map((key) => (
                <MenuItem key={key} value={key} disabled={key === ControlMode.CapitalShare}>
                  {t(key)}
                  {key === ControlMode.CapitalShare && <em> ({t('coming')})</em>}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </div>
      )}
      {showWarning && pendingControlMode && (
        <ControlModeChangeWarningModal
          open={showWarning}
          currentMode={values[id] as ControlMode}
          newMode={pendingControlMode}
          onConfirm={confirmControlModeChange}
          onCancel={cancelControlModeChange}
        />
      )}
    </div>
  )
}

export default ExportCheckbox
