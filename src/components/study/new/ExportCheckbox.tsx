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
import BegesDeactivationWarningModal from './BegesDeactivationWarningModal'
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
  const [showControlModeWarning, setShowControlModeWarning] = useState(false)
  const [pendingControlMode, setPendingControlMode] = useState<ControlMode | null>(null)
  const [showBegesActivationWarning, setShowBegesActivationWarning] = useState(false)
  const [pendingBegesCheck, setPendingBegesCheck] = useState<boolean>(false)
  const [showBegesDeactivationWarning, setShowBegesDeactivationWarning] = useState(false)
  const [pendingBegesUncheck, setPendingBegesUncheck] = useState<boolean>(false)
  const isNewStudy = !study && !duplicateStudyId

  const hasCaracterisations = useMemo(
    () => !!study && study.emissionSources.some((source) => source.caracterisation !== null),
    [study],
  )

  const hasValidatedSources = useMemo(
    () => !!study && study.emissionSources.some((source) => source.validated),
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

  const closeBegesActivation = () => {
    setShowBegesActivationWarning(false)
    setPendingBegesCheck(false)
  }

  const closeBegesDeactivation = () => {
    setShowBegesDeactivationWarning(false)
    setPendingBegesUncheck(false)
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

  const confirmBegesDeactivation = async () => {
    if (pendingBegesUncheck) {
      setValues({ ...values, [id]: false })
    }
    closeBegesDeactivation()
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
        onChange={(_, checked) => {
          const shouldShowBegesActivationWarning = hasValidatedSources && !isNewStudy
          const shouldShowBegesDeactivationWarning = hasCaracterisations && !isNewStudy

          if (checked && id === Export.Beges && !values[id]) {
            // Show warning when checking BEGES export
            if (shouldShowBegesActivationWarning) {
              setPendingBegesCheck(true)
              setShowBegesActivationWarning(true)
            } else {
              setValues({ ...values, [id]: ControlMode.Operational })
            }
          } else if (!checked && id === Export.Beges && values[id]) {
            // Show warning when unchecking BEGES export
            if (shouldShowBegesDeactivationWarning) {
              setPendingBegesUncheck(true)
              setShowBegesDeactivationWarning(true)
            } else {
              setValues({ ...values, [id]: false })
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
          open={showControlModeWarning}
          currentMode={values[id] as ControlMode}
          newMode={pendingControlMode}
          onConfirm={confirmControlModeChange}
          onCancel={closeControlModeChange}
        />
      )}
      {showBegesActivationWarning && pendingBegesCheck && (
        <BegesActivationWarningModal
          open={showBegesActivationWarning}
          onConfirm={confirmBegesActivation}
          onCancel={closeBegesActivation}
        />
      )}
      {showBegesDeactivationWarning && pendingBegesUncheck && (
        <BegesDeactivationWarningModal
          open={showBegesDeactivationWarning}
          onConfirm={confirmBegesDeactivation}
          onCancel={closeBegesDeactivation}
        />
      )}
    </div>
  )
}

export default ExportCheckbox
