import type { FullStudy } from '@/db/study'
import { updateStudySpecificExportFields } from '@/services/serverFunctions/study'
import { sortAlphabetically } from '@/services/utils'
import { exportSpecificFields, getAllSpecificFieldsForExports } from '@/utils/study'
import { useServerFunction } from '@abc-transitionbascarbone/application/components/hooks/useServerFunction'
import { HelpIcon } from '@abc-transitionbascarbone/application/components'
import GlossaryModal from '@abc-transitionbascarbone/application/components/modals/GlossaryModal'
import {
  ControlMode,
  EmissionFactorBase,
  EmissionSourceCaracterisation,
  Export,
} from '@abc-transitionbascarbone/db/enums'
import { Checkbox, FormControlLabel } from '@mui/material'
import { useTranslations } from 'next-intl'
import { useCallback, useMemo, useState } from 'react'
import ExportActivationWarningModal from './ExportActivationWarningModal'
import ExportCheckbox from './ExportCheckbox'
import styles from './ExportCheckbox.module.css'
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

const ghgpActivation = process.env.NEXT_PUBLIC_GHGP_ACTIVATION_DATE

const ExportCheckboxes = ({ study, values, onChange, setControl, disabled, duplicateStudyId }: Props) => {
  const { callServerFunction } = useServerFunction()
  const t = useTranslations('exports')
  const [pendingExportCheck, setPendingExportCheck] = useState<Export | null>(null)
  const [pendingExportUncheck, setPendingExportUncheck] = useState<Export | null>(null)
  const [openGlossary, setOpenGlossary] = useState(false)
  const isNewStudy = useMemo(() => !study && !duplicateStudyId, [duplicateStudyId, study])

  const hasValidatedSources = useMemo(
    () => !!study && study.emissionSources.some((source) => source.validated),
    [study],
  )
  const hasFinalClientCaracterisation = useMemo(
    () =>
      !!study &&
      !!ghgpActivation &&
      study.createdAt < new Date(ghgpActivation) &&
      study.emissionSources.some((source) => source.caracterisation === EmissionSourceCaracterisation.FinalClient),
    [study],
  )

  const currentStudySpecificFields = useMemo(() => getAllSpecificFieldsForExports(values.exports), [values])

  const hasSomeEmissionSourceWithSpecificFieldsFilled = useCallback(
    (type: Export, specificFields: string[]) =>
      !!study &&
      study.emissionSources.some((source) => {
        const hasSomeSpecificFieldsFilled = specificFields.some(
          (field) => source[field as keyof typeof source] !== null,
        )
        const isGHGPAndHasMarketBased =
          type === Export.GHGP && source.emissionFactor?.base === EmissionFactorBase.MarketBased

        return hasSomeSpecificFieldsFilled || isGHGPAndHasMarketBased
      }),
    [study],
  )

  const shouldShowExportDeactivationWarning = (type: Export) => {
    const newExports = values.exports.filter((exportType) => exportType !== type)
    const newExportsSpecificFields = getAllSpecificFieldsForExports(newExports)

    return (
      hasSomeEmissionSourceWithSpecificFieldsFilled(
        type,
        exportSpecificFields[type].filter((field) => !newExportsSpecificFields.includes(field)),
      ) && !isNewStudy
    )
  }

  const onValueChange = async (type: Export, checked: boolean) => {
    const typeFields = exportSpecificFields[type]
    if (checked) {
      // Mandatoryfields added, show warning message
      if (typeFields.some((field) => !currentStudySpecificFields.includes(field)) && hasValidatedSources) {
        setPendingExportCheck(type)
      } else {
        const newExports = values.exports.concat(type)
        onChange(newExports)
      }
    } else if (shouldShowExportDeactivationWarning(type)) {
      setPendingExportUncheck(type)
    } else {
      const newExports = values.exports.filter((exportType) => exportType !== type)
      onChange(newExports)
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
        <div className={styles.field}>
          <FormControlLabel
            control={<Checkbox checked className={styles.checkbox} disabled />}
            label={<span className={styles.bcExport}>{t('consolidated')}</span>}
          />
          <HelpIcon
            onClick={(e) => {
              e.preventDefault()
              setOpenGlossary((prevOpen) => !prevOpen)
            }}
            label={t('consolidated')}
          />
        </div>
        {Object.keys(Export)
          .sort(sortAlphabetically)
          .map((exportType, i) => (
            <ExportCheckbox
              key={exportType}
              exportType={exportType as Export}
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
          hasFinalClientCaracterisation={hasFinalClientCaracterisation}
          activeFields={currentStudySpecificFields || []}
          onConfirm={confirmExportActivation}
          onCancel={() => setPendingExportCheck(null)}
        />
      )}
      {pendingExportUncheck && (
        <ExportDeactivationWarningModal
          type={pendingExportUncheck}
          remainingExports={values.exports.filter((exportType) => exportType !== pendingExportUncheck)}
          onConfirm={confirmExportDeactivation}
          onCancel={() => setPendingExportUncheck(null)}
        />
      )}
      {openGlossary && (
        <GlossaryModal
          label="glossary-help-school-search"
          glossary="consolidated"
          t={t}
          onClose={() => setOpenGlossary(false)}
        >
          {t('bc.checkboxDisabled')}
        </GlossaryModal>
      )}
    </>
  )
}

export default ExportCheckboxes
