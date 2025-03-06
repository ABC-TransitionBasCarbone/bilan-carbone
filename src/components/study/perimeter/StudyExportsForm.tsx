import HelpIcon from '@/components/base/HelpIcon'
import { StudyExportsCommand } from '@/services/serverFunctions/study.command'
import { FormControl, FormGroup, FormLabel } from '@mui/material'
import { Export } from '@prisma/client'
import classNames from 'classnames'
import { useTranslations } from 'next-intl'
import { Control, Controller, UseFormReturn } from 'react-hook-form'
import formStyles from '../../form/Form.module.css'
import ExportCheckbox from '../new/ExportCheckbox'
import styles from './StudyExports.module.css'

interface Props<T extends StudyExportsCommand> {
  form: UseFormReturn<T>
  showControl: boolean
  setGlossary: (key: string) => void
  t: ReturnType<typeof useTranslations>
  disabled?: boolean
}

const StudyExportsForm = <T extends StudyExportsCommand>({ form, showControl, setGlossary, t, disabled }: Props<T>) => {
  const tGlossary = useTranslations('study.new.glossary')
  const control = form?.control as Control<StudyExportsCommand>
  return (
    <Controller
      name="exports"
      control={control}
      render={({ field: { onChange, value }, fieldState: { error } }) => (
        <FormControl error={!!error} component="fieldset">
          <div className="flex mb-2 mt2">
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
            <div className={styles.exports}>
              {Object.keys(Export).map((key) => (
                <ExportCheckbox key={key} id={key as Export} values={value} setValues={onChange} disabled={disabled} />
              ))}
            </div>
          </FormGroup>
        </FormControl>
      )}
    />
  )
}

export default StudyExportsForm
