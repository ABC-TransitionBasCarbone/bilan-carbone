import { Select } from '@/components/base/Select'
import ControlModeChangeWarningModal from '@/components/study/perimeter/ControlModeChangeWarningModal'
import { FullStudy } from '@/db/study'
import { useServerFunction } from '@/hooks/useServerFunction'
import { updateCaracterisationsForControlMode } from '@/services/serverFunctions/study'
import { Checkbox, FormControl, FormControlLabel, MenuItem } from '@mui/material'
import { ControlMode, Export } from '@prisma/client'
import { useTranslations } from 'next-intl'
import { Dispatch, SetStateAction, useMemo, useState } from 'react'
import styles from './ExportCheckbox.module.css'

interface Props {
  id: Export
  study?: FullStudy
  values: Record<Export, ControlMode | false>
  setValues: Dispatch<SetStateAction<Record<Export, ControlMode | false>>>
  onChange: (type: Export, checked: boolean) => void
  disabled?: boolean
  duplicateStudyId?: string | null
}

const ExportCheckbox = ({ id, study, values, setValues, onChange, disabled, duplicateStudyId }: Props) => {
  const t = useTranslations('study.new')
  const tExport = useTranslations('exports')
  const { callServerFunction } = useServerFunction()
  const [showControlModeWarning, setShowControlModeWarning] = useState(false)
  const [pendingControlMode, setPendingControlMode] = useState<ControlMode | null>(null)
  const isNewStudy = !study && !duplicateStudyId

  const hasCaracterisations = useMemo(
    () => !!study && study.emissionSources.some((source) => source.caracterisation !== null),
    [study],
  )

  const handleControlModeChange = (newControlMode: ControlMode) => {
    const currentControlMode = values[id] as ControlMode

    const shouldShowControlModeChangeWarning =
      currentControlMode && currentControlMode !== newControlMode && hasCaracterisations && !isNewStudy

    if (shouldShowControlModeChangeWarning) {
      setPendingControlMode(newControlMode)
      setShowControlModeWarning(true)
    } else {
      setValues({ ...values, [id]: newControlMode })
    }
  }

  const closeControlModeChange = () => {
    setShowControlModeWarning(false)
    setPendingControlMode(null)
  }

  const confirmControlModeChange = async () => {
    if (pendingControlMode && study) {
      if (duplicateStudyId) {
        // For duplicate studies, don't clear characterizations immediately
        setValues({ ...values, [id]: pendingControlMode })
      } else {
        // For existing studies, clear characterizations immediately
        await callServerFunction(() => updateCaracterisationsForControlMode(study.id, pendingControlMode), {
          onSuccess: () => {
            setValues({ ...values, [id]: pendingControlMode })
          },
        })
      }
    }
    closeControlModeChange()
  }

  const isExportAvailable = useMemo(() => ([Export.Beges, Export.GHGP] as Export[]).includes(id), [id])

  return (
    <div className={styles.container}>
      <FormControlLabel
        className={styles.field}
        control={
          <Checkbox
            checked={!!values[id]}
            className={styles.checkbox}
            disabled={!isExportAvailable || disabled}
            data-testid={`export-checkbox-${id}`}
          />
        }
        label={
          <span>
            {tExport(id)}
            {!isExportAvailable && <em> ({t('coming')})</em>}
          </span>
        }
        value={!!values[id]}
        onChange={(_, checked) => onChange(id, checked)}
      />
      {values[id] && (
        <div className={styles.field}>
          <FormControl fullWidth>
            <Select
              size="small"
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
      {showControlModeWarning && pendingControlMode && (
        <ControlModeChangeWarningModal
          open
          currentMode={values[id] as ControlMode}
          newMode={pendingControlMode}
          onConfirm={confirmControlModeChange}
          onCancel={closeControlModeChange}
        />
      )}
    </div>
  )
}

export default ExportCheckbox
