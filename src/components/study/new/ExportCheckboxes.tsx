import { FullStudy } from '@/db/study'
import { useServerFunction } from '@/hooks/useServerFunction'
import { updateStudySpecificExportFields } from '@/services/serverFunctions/study'
import { allSpecificFieldsForExports, exportSpecificFields } from '@/utils/study'
import { ControlMode, Export } from '@prisma/client'
import { useCallback, useMemo, useState } from 'react'
import ExportActivationWarningModal from './ExportActivationWarningModal'
import ExportCheckbox from './ExportCheckbox'
import ExportDeactivationWarningModal from './ExportDeactivationWarningModal'

type ExportValues = {
  exports: Export[]
  controlMode?: ControlMode | null
}

interface Props {
  study?: FullStudy
  values: ExportValues
  onChange: (value: Export[]) => void
  setControl: (value: ControlMode) => void
  disabled?: boolean
  duplicateStudyId?: string | null
}

const ExportCheckboxes = ({ study, values, onChange, setControl, disabled, duplicateStudyId }: Props) => {
  const { callServerFunction } = useServerFunction()
  const [pendingExportCheck, setPendingExportCheck] = useState<Export | null>(null)
  const [pendingExportUncheck, setPendingExportUncheck] = useState<Export | null>(null)
  const isNewStudy = useMemo(() => !study && !duplicateStudyId, [duplicateStudyId, study])

  const hasValidatedSources = useMemo(
    () => !!study && study.emissionSources.some((source) => source.validated),
    [study],
  )

  const activeFields = useMemo(() => allSpecificFieldsForExports(values.exports), [values])

  const hasSpecificFields = useCallback(
    (type: Export) =>
      !!study &&
      study.emissionSources.some((source) =>
        exportSpecificFields[type].some((field) => source[field as keyof typeof source] !== null),
      ),
    [study],
  )

  const shouldShowExportActivationWarning = hasValidatedSources && !isNewStudy
  const shouldShowExportDeactivationWarning = (type: Export) => {
    const newExports = values.exports.filter((exportType) => exportType !== type)
    const newFields = allSpecificFieldsForExports(newExports)
    return (
      hasSpecificFields(type) && exportSpecificFields[type].some((field) => !newFields.includes(field)) && !isNewStudy
    )
  }

  const onValueChange = (type: Export, checked: boolean) => {
    const typeFields = exportSpecificFields[type]
    if (checked) {
      // Mandatoryfields added, show warning message
      if (typeFields.some((field) => !activeFields.includes(field)) && shouldShowExportActivationWarning) {
        setPendingExportCheck(type)
      } else {
        onChange(values.exports.concat(type))
      }
    } else if (shouldShowExportDeactivationWarning(type)) {
      setPendingExportUncheck(type)
    } else {
      onChange(values.exports.filter((exportType) => exportType !== type))
    }
  }

  const confirmExportActivation = async (type: Export) => {
    const newValues = values.exports.concat(type)
    if (pendingExportCheck) {
      if (!study || duplicateStudyId) {
        onChange(newValues)
      } else {
        await callServerFunction(
          () => updateStudySpecificExportFields(study.id, values.controlMode || ControlMode.Operational, newValues),
          { onSuccess: () => onChange(newValues) },
        )
      }
    }
    setPendingExportCheck(null)
  }

  const confirmExportDeactivation = async (type: Export) => {
    const newValues = values.exports.filter((exportType) => exportType !== type)
    if (pendingExportUncheck) {
      if (!study || duplicateStudyId) {
        onChange(newValues)
      } else {
        await callServerFunction(
          () => updateStudySpecificExportFields(study.id, values.controlMode || ControlMode.Operational, newValues),
          { onSuccess: () => onChange(newValues) },
        )
      }
    }
    setPendingExportUncheck(null)
  }

  return (
    <>
      <div className="flex-col">
        {Object.keys(Export).map((key, i) => (
          <ExportCheckbox
            key={key}
            id={key as Export}
            index={i}
            study={study}
            values={values}
            setControl={setControl}
            onChange={onValueChange}
            disabled={disabled}
            duplicateStudyId={duplicateStudyId}
          />
        ))}
      </div>
      {pendingExportCheck && (
        <ExportActivationWarningModal
          type={pendingExportCheck}
          activeFields={activeFields || []}
          onConfirm={confirmExportActivation}
          onCancel={() => setPendingExportCheck(null)}
        />
      )}
      {pendingExportUncheck && (
        <ExportDeactivationWarningModal
          type={pendingExportUncheck}
          remaining={values.exports.filter((exportType) => exportType !== pendingExportUncheck)}
          onConfirm={confirmExportDeactivation}
          onCancel={() => setPendingExportUncheck(null)}
        />
      )}
    </>
  )
}

export default ExportCheckboxes
