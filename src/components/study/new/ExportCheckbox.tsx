import { Select } from '@/components/base/Select'
import ControlModeChangeWarningModal from '@/components/study/perimeter/ControlModeChangeWarningModal'
import { FullStudy } from '@/db/study'
import { useServerFunction } from '@/hooks/useServerFunction'
import { updateStudySpecificExportFields } from '@/services/serverFunctions/study'
import { Checkbox, FormControl, FormControlLabel, MenuItem } from '@mui/material'
import { ControlMode, Export } from '@prisma/client'
import { useTranslations } from 'next-intl'
import { useMemo, useState } from 'react'
import styles from './ExportCheckbox.module.css'

interface Props {
  id: Export
  index: number
  study?: FullStudy
  values: {
    exports: Export[]
    controlMode?: ControlMode | null
  }
  onChange: (type: Export, checked: boolean) => void
  setControl: (value: ControlMode) => void
  disabled?: boolean
  duplicateStudyId?: string | null
}

const ExportCheckbox = ({ id, index, study, values, onChange, setControl, disabled, duplicateStudyId }: Props) => {
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
    const currentControlMode = values.controlMode as ControlMode

    const shouldShowControlModeChangeWarning =
      currentControlMode && currentControlMode !== newControlMode && hasCaracterisations && !isNewStudy

    if (shouldShowControlModeChangeWarning) {
      setPendingControlMode(newControlMode)
      setShowControlModeWarning(true)
    } else {
      setControl(newControlMode)
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
        setControl(pendingControlMode)
      } else {
        // For existing studies, clear characterizations immediately
        await callServerFunction(() => updateStudySpecificExportFields(study.id, pendingControlMode), {
          onSuccess: () => {
            setControl(pendingControlMode)
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
            checked={!!values.exports.includes(id)}
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
        value={!!values.exports.includes(id)}
        onChange={(_, checked) => onChange(id, checked)}
      />
      {index === 0 && !!values.exports.length && (
        <div className={styles.field}>
          <FormControl fullWidth>
            <Select
              size="small"
              value={values.controlMode}
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
          currentMode={values.controlMode as ControlMode}
          newMode={pendingControlMode}
          onConfirm={confirmControlModeChange}
          onCancel={closeControlModeChange}
        />
      )}
    </div>
  )
}

export default ExportCheckbox
