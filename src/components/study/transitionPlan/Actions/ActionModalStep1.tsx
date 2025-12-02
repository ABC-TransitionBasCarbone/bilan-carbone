import { FormDatePicker } from '@/components/form/DatePicker'
import { FormSelect } from '@/components/form/Select'
import { FormTextField } from '@/components/form/TextField'
import { AddActionCommand } from '@/services/serverFunctions/transitionPlan.command'
import { getYearFromDateStr } from '@/utils/time'
import { Checkbox, FormControlLabel, MenuItem } from '@mui/material'
import { ActionPotentialDeduction } from '@prisma/client'
import classNames from 'classnames'
import dayjs from 'dayjs'
import { useTranslations } from 'next-intl'
import { useEffect } from 'react'
import { Control, FieldErrors, UseFormGetValues, UseFormSetValue, useWatch } from 'react-hook-form'
import textUnitStyles from '../../../dynamic-form/inputFields/TextUnitInput.module.css'
import styles from './ActionModal.module.css'

interface Props {
  studyUnit: string
  control: Control<AddActionCommand>
  setValue: UseFormSetValue<AddActionCommand>
  getValues: UseFormGetValues<AddActionCommand>
  errors: FieldErrors<AddActionCommand>
}

const ActionModalStep1 = ({ studyUnit, control, setValue }: Props) => {
  const t = useTranslations('study.transitionPlan.actions.addModal')
  const tUnit = useTranslations('study.results.units')
  const tDeduction = useTranslations('study.transitionPlan.actions.potentialDeduction')
  const potentialDeduction = useWatch({ control, name: 'potentialDeduction' })
  const reductionStartYear = useWatch({ control, name: 'reductionStartYear' })
  const reductionEndYear = useWatch({ control, name: 'reductionEndYear' })
  const dependenciesOnly = useWatch({ control, name: 'dependenciesOnly' })

  useEffect(() => {
    if (reductionStartYear && reductionEndYear) {
      const startYear = getYearFromDateStr(reductionStartYear)
      const endYear = getYearFromDateStr(reductionEndYear)
      if (startYear > endYear) {
        setValue('reductionEndYear', reductionStartYear)
      }
    }
  }, [reductionStartYear, reductionEndYear, setValue])

  return (
    <>
      <FormTextField
        control={control}
        name="title"
        label={`${t('title')} *`}
        placeholder={t('titlePlaceholder')}
        data-testid="add-action-title"
      />
      <FormTextField
        control={control}
        name="subSteps"
        label={`${t('subSteps')} *`}
        placeholder={t('subStepsPlaceholder')}
        multiline
        data-testid="add-action-subSteps"
      />
      <FormTextField
        control={control}
        name="detailedDescription"
        label={`${t('detailedDescription')} *`}
        placeholder={t('detailedDescriptionPlaceholder')}
        multiline
        data-testid="add-action-detailedDescription"
      />
      <FormSelect
        data-testid="emission-factor-unit"
        control={control}
        translation={t}
        label={`${t('potentialDeduction')} *`}
        name="potentialDeduction"
        fullWidth
      >
        {Object.values(ActionPotentialDeduction).map((potential) => (
          <MenuItem key={potential} value={potential} disabled={potential === ActionPotentialDeduction.EmissionSources}>
            {tDeduction(potential)}
          </MenuItem>
        ))}
      </FormSelect>

      <div className={classNames('flex gapped1 w100', styles.reductionContainer)}>
        {potentialDeduction === ActionPotentialDeduction.Quantity && (
          <div className={styles.reductionValue}>
            <FormTextField
              label={`${t('reductionValue')} *`}
              type="number"
              control={control}
              name="reductionValue"
              endAdornment={<div className={textUnitStyles.unit}>{tUnit(studyUnit)}</div>}
              data-testid="add-action-reductionValue"
            />
          </div>
        )}
        <div className={classNames('flex gapped1 w100', styles.reductionYearContainer)}>
          <FormDatePicker
            label={`${t('reductionStartYear')} *`}
            control={control}
            translation={t}
            className={styles.reductionYear}
            name="reductionStartYear"
            views={['year']}
            minDate={dayjs()}
            data-testid="add-action-reductionStartYear"
          />
          <FormDatePicker
            label={`${t('reductionEndYear')} *`}
            control={control}
            translation={t}
            className={styles.reductionYear}
            name="reductionEndYear"
            views={['year']}
            minDate={dayjs(reductionStartYear)}
            data-testid="add-action-reductionEndYear"
          />
        </div>
      </div>

      <FormTextField
        control={control}
        name="reductionDetails"
        label={t('reductionDetails')}
        placeholder={t('reductionDetailsPlaceholder')}
        multiline
        data-testid="add-action-reductionDetails"
      />

      <FormControlLabel
        control={
          <Checkbox
            checked={dependenciesOnly ?? false}
            onChange={(e) => setValue('dependenciesOnly', e.target.checked)}
          />
        }
        label={t('dependenciesOnly')}
      />
    </>
  )
}

export default ActionModalStep1
