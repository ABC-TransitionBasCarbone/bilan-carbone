import { Select } from '@/components/base/Select'
import ControlModeChangeWarningModal from '@/components/study/perimeter/ControlModeChangeWarningModal'
import { FullStudy } from '@/db/study'
import { useServerFunction } from '@/hooks/useServerFunction'
import { updateCaracterisationsForControlMode } from '@/services/serverFunctions/study'
import { Checkbox, FormControl, FormControlLabel, MenuItem } from '@mui/material'
import { ControlMode, Export } from '@prisma/client'
import { useTranslations } from 'next-intl'
import { Dispatch, SetStateAction, useMemo, useState } from 'react'
import BegesActivationWarningModal from './BegesActivationWarningModal'
import styles from './ExportCheckbox.module.css'

interface Props {
  id: Export
  study?: FullStudy
  values: Record<Export, ControlMode | false>
  setValues: Dispatch<SetStateAction<Record<Export, ControlMode | false>>>
  disabled?: boolean
  duplicateStudyId?: string | null
}

const ExportCheckbox = ({ id, study, values, setValues, disabled, duplicateStudyId }: Props) => {
  const t = useTranslations('study.new')
  const tExport = useTranslations('exports')
  const { callServerFunction } = useServerFunction()
  const [showWarning, setShowWarning] = useState(false)
  const [pendingControlMode, setPendingControlMode] = useState<ControlMode | null>(null)
  const [showBegesWarning, setShowBegesWarning] = useState(false)
  const [pendingBegesCheck, setPendingBegesCheck] = useState<boolean>(false)

  const hasCaracterisations = useMemo(
    () => study && study.emissionSources.some((source) => source.caracterisation !== null),
    [study],
  )

  const handleControlModeChange = (newControlMode: ControlMode) => {
    const currentControlMode = values[id] as ControlMode

    const shouldShowWarning =
      currentControlMode &&
      currentControlMode !== newControlMode &&
      ((hasCaracterisations && study) || duplicateStudyId)

    if (shouldShowWarning) {
      setPendingControlMode(newControlMode)
      setShowWarning(true)
    } else {
      setValues({ ...values, [id]: newControlMode })
    }
  }

  const closeControlModeChange = () => {
    setShowWarning(false)
    setPendingControlMode(null)
  }

  const closeBegesActivation = () => {
    setShowBegesWarning(false)
    setPendingBegesCheck(false)
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

  const confirmBegesActivation = async () => {
    if (pendingBegesCheck) {
      if (!study || duplicateStudyId) {
        setValues({ ...values, [id]: ControlMode.Operational })
      } else {
        await callServerFunction(() => updateCaracterisationsForControlMode(study.id, ControlMode.Operational), {
          onSuccess: () => {
            setValues({ ...values, [id]: ControlMode.Operational })
          },
        })
      }
    }
    closeBegesActivation()
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
        onChange={(_, checked) => {
          if (checked && id === Export.Beges && !values[id]) {
            // Show warning when checking BEGES for the first time
            const shouldShowWarning = (hasCaracterisations && study) || duplicateStudyId
            if (shouldShowWarning) {
              setPendingBegesCheck(true)
              setShowBegesWarning(true)
            } else {
              setValues({ ...values, [id]: ControlMode.Operational })
            }
          } else {
            setValues({ ...values, [id]: checked ? ControlMode.Operational : false })
          }
        }}
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
          onCancel={closeControlModeChange}
        />
      )}
      {showBegesWarning && pendingBegesCheck && (
        <BegesActivationWarningModal
          open={showBegesWarning}
          onConfirm={confirmBegesActivation}
          onCancel={closeBegesActivation}
        />
      )}
    </div>
  )
}

export default ExportCheckbox
