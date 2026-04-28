import HelpIcon from '@/components/base/HelpIcon'
import type { FullStudy } from '@/db/study'
import { StudyExportsCommand } from '@/services/serverFunctions/study.command'
import { Translations } from '@repo/lib'
import { FormControl, FormGroup, FormLabel } from '@mui/material'
import { ControlMode, Export } from '@repo/db-common/enums'
import classNames from 'classnames'
import { useTranslations } from 'next-intl'
import { Control, Controller, UseFormReturn, UseFormSetValue } from 'react-hook-form'
import formStyles from '../../form/Form.module.css'
import ExportCheckboxes from '../new/ExportCheckboxes'
import styles from './StudyExports.module.css'

interface Props<T extends StudyExportsCommand> {
  form: UseFormReturn<T>
  study?: FullStudy
  showControl: boolean
  setGlossary: (key: string) => void
  t: Translations
  disabled?: boolean
  duplicateStudyId?: string | null
  onSave?: (exports: Export[], controlMode: ControlMode) => void
}

const StudyExportsForm = <T extends StudyExportsCommand>({
  form,
  study,
  showControl,
  setGlossary,
  t,
  disabled,
  duplicateStudyId,
  onSave,
}: Props<T>) => {
  const tGlossary = useTranslations('study.new.glossary')
  const control = form?.control as Control<StudyExportsCommand>
  const setValue = form?.setValue as UseFormSetValue<StudyExportsCommand>

  return (
    <div className="mt2">
      <Controller
        name="exports"
        control={control}
        render={({ fieldState: { error } }) => (
          <FormControl error={!!error} component="fieldset">
            <div className="flex">
              <FormLabel component="legend" className={styles.exportsLabel}>
                <div className={classNames(formStyles.gapped, 'align-center')}>
                  <span className="inputLabel bold">{t('exports')}</span>
                  <div className={formStyles.icon}>
                    {<HelpIcon onClick={() => setGlossary('exports')} label={tGlossary('title')} />}
                  </div>
                </div>
              </FormLabel>
              {showControl && (
                <FormLabel component="legend">
                  <div className={classNames(formStyles.gapped, 'align-center')}>
                    <span className="inputLabel bold">{t('control')}</span>
                    <div className={formStyles.icon}>
                      {<HelpIcon onClick={() => setGlossary('control')} label={tGlossary('title')} />}
                    </div>
                  </div>
                </FormLabel>
              )}
            </div>
            <FormGroup>
              <ExportCheckboxes
                values={form.getValues()}
                setControl={(value: ControlMode) => {
                  setValue('controlMode', value)
                  onSave?.(form.getValues().exports, value)
                }}
                onChange={(value: Export[]) => {
                  const currentValues = form.getValues()
                  const controlMode =
                    currentValues.exports.length === 0 && value.length === 1
                      ? ControlMode.Operational
                      : currentValues.controlMode || ControlMode.Operational
                  setValue('exports', value)
                  if (currentValues.exports.length === 0 && value.length === 1) {
                    setValue('controlMode', ControlMode.Operational)
                  }
                  onSave?.(value, controlMode)
                }}
                study={study}
                disabled={disabled}
                duplicateStudyId={duplicateStudyId}
              />
            </FormGroup>
          </FormControl>
        )}
      />
    </div>
  )
}

export default StudyExportsForm
