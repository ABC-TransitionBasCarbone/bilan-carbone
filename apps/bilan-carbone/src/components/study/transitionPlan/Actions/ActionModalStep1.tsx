import { CustomFormLabel } from '@/components/form/CustomFormLabel'
import { FormDatePicker } from '@/components/form/DatePicker'
import ScopeSelectors, { TagFamily } from '@/components/form/ScopeSelectors'
import { FormSelect } from '@/components/form/Select'
import { FormTextField } from '@/components/form/TextField'
import { AddActionFormCommand } from '@/services/serverFunctions/action.command'
import { getYearFromDateStr } from '@/utils/time'
import { MenuItem } from '@mui/material'
import type { StudyResultUnit } from '@repo/db-common'
import { ActionPotentialDeduction, SubPost } from '@repo/db-common/enums'
import classNames from 'classnames'
import dayjs from 'dayjs'
import { useTranslations } from 'next-intl'
import { useEffect } from 'react'
import { Control, FieldErrors, UseFormGetValues, UseFormSetValue, useWatch } from 'react-hook-form'
import textUnitStyles from '../../../dynamic-form/inputFields/TextUnitInput.module.css'
import styles from './ActionModal.module.css'
import ActionStepsList from './ActionStepsList'

interface Props {
  studyUnit: StudyResultUnit
  control: Control<AddActionFormCommand>
  setValue: UseFormSetValue<AddActionFormCommand>
  getValues: UseFormGetValues<AddActionFormCommand>
  errors: FieldErrors<AddActionFormCommand>
  sites: Array<{ id: string; name: string }>
  tagFamilies: TagFamily[]
}

const ActionModalStep1 = ({ studyUnit, control, setValue, errors, sites, tagFamilies }: Props) => {
  const t = useTranslations('study.transitionPlan.actions.addModal')
  const tScope = useTranslations('study.transitionPlan.scope')
  const tUnit = useTranslations('study.results.units')
  const tDeduction = useTranslations('study.transitionPlan.actions.potentialDeduction')
  const potentialDeduction = useWatch({ control, name: 'potentialDeduction' })
  const reductionStartYear = useWatch({ control, name: 'reductionStartYear' })
  const reductionEndYear = useWatch({ control, name: 'reductionEndYear' })
  const siteIds = useWatch({ control, name: 'siteIds' })
  const tagIds = useWatch({ control, name: 'tagIds' })
  const subPosts = useWatch({ control, name: 'subPosts' })

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
    <div className="flex-col gapped1 pb2">
      <FormTextField
        control={control}
        name="title"
        label={`${t('title')} *`}
        placeholder={t('titlePlaceholder')}
        data-testid="add-action-title"
      />
      <ActionStepsList control={control} errors={errors} />
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
            className={styles.reductionYear}
            name="reductionStartYear"
            views={['year']}
            minDate={dayjs()}
            data-testid="add-action-reductionStartYear"
          />
          <FormDatePicker
            label={`${t('reductionEndYear')} *`}
            control={control}
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

      <div className="flex-col">
        <CustomFormLabel label={tScope('scopeSelection')} />
        <ScopeSelectors
          siteIds={siteIds ?? []}
          tagIds={tagIds ?? []}
          subPosts={(subPosts ?? []) as SubPost[]}
          sites={sites}
          tagFamilies={tagFamilies}
          onSiteIdsChange={(value) => setValue('siteIds', value, { shouldValidate: true })}
          onTagIdsChange={(value) => setValue('tagIds', value, { shouldValidate: true })}
          onSubPostsChange={(value) => setValue('subPosts', value, { shouldValidate: true })}
          isOtherDisabled={true}
          siteIdsError={errors.siteIds?.message}
          subPostsError={errors.subPosts?.message}
          tagIdsError={errors.tagIds?.message}
        />
      </div>
    </div>
  )
}

export default ActionModalStep1
