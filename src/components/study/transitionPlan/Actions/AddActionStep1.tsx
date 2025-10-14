import { FormDatePicker } from '@/components/form/DatePicker'
import { FormSelect } from '@/components/form/Select'
import { FormTextField } from '@/components/form/TextField'
import { AddActionCommand } from '@/services/serverFunctions/study.command'
import { MenuItem, TextField } from '@mui/material'
import classNames from 'classnames'
import dayjs from 'dayjs'
import { useTranslations } from 'next-intl'
import { useEffect } from 'react'
import { Control, UseFormGetValues, UseFormSetValue, useWatch } from 'react-hook-form'
import textUnitStyles from '../../../dynamic-form/inputFields/TextUnitInput.module.css'

interface Props {
  studyUnit: string
  control: Control<AddActionCommand>
  setValue: UseFormSetValue<AddActionCommand>
  getValues: UseFormGetValues<AddActionCommand>
}

const AddActionStep1 = ({ studyUnit, control, setValue }: Props) => {
  const t = useTranslations('study.transitionPlan.actions.addModal')
  const tUnit = useTranslations('study.results.units')
  const potentialDeduction = useWatch({ control, name: 'potentialDeduction' })
  const reductionStartYear = useWatch({ control, name: 'reductionStartYear' })
  const reductionEffectsStart = useWatch({ control, name: 'reductionEffectsStart' })

  useEffect(() => {
    if (
      reductionStartYear &&
      reductionEffectsStart &&
      dayjs(reductionStartYear).year() > dayjs(reductionEffectsStart).year()
    ) {
      setValue('reductionEffectsStart', reductionStartYear)
    }
  }, [reductionStartYear, reductionEffectsStart, setValue])

  return (
    <>
      <FormTextField
        control={control}
        translation={t}
        name="title"
        label={`${t('title')} *`}
        placeholder={t('titlePlaceholder')}
        data-testid="add-action-title"
      />
      <FormTextField
        control={control}
        translation={t}
        name="subSteps"
        label={`${t('subSteps')} *`}
        placeholder={t('subStepsPlaceholder')}
        data-testid="add-action-subSteps"
      />
      <FormTextField
        control={control}
        translation={t}
        name="aim"
        label={`${t('aim')} *`}
        placeholder={t('aimPlaceholder')}
        data-testid="add-action-aim"
      />
      <FormTextField
        control={control}
        translation={t}
        name="detailedDescription"
        label={`${t('detailedDescription')} *`}
        placeholder={t('detailedDescriptionPlaceholder')}
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
        <MenuItem value="quality">{t('quality')}</MenuItem>
        <MenuItem value="quantity">{t('quantity')}</MenuItem>
        <MenuItem value="emissionSources" disabled>
          {t('emissionSources')}
        </MenuItem>
      </FormSelect>
      {potentialDeduction === 'quantity' && (
        <>
          <div className=" flex-col grow">
            <span className="inputLabel bold mb-2">{`${t('reductionValue')} *`}</span>
            <div className={classNames('flex grow relative')}>
              <TextField
                type="number"
                className="grow"
                defaultValue={undefined}
                onBlur={(event) => setValue('reductionValue', Number(event.target.value))}
                slotProps={{
                  input: { onWheel: (event) => (event.target as HTMLInputElement).blur() },
                }}
              />
              <div className={textUnitStyles.unit}>{tUnit(studyUnit)}</div>
            </div>
          </div>
          <div className="flex grow gapped">
            <div className="flex-col grow">
              <span className="inputLabel bold mb-2">{`${t('reductionStartYear')} *`}</span>
              <div className={classNames('flex grow relative')}>
                <FormDatePicker
                  control={control}
                  className="grow"
                  translation={t}
                  name="reductionStartYear"
                  views={['year']}
                  minDate={dayjs()}
                  fullWidth
                  data-testid="add-action-reductionStartYear"
                />
              </div>
            </div>
            <div className="flex-col grow">
              <span className="inputLabel bold mb-2">{`${t('reductionEffectsStart')} *`}</span>
              <div className={classNames('flex grow relative')}>
                <FormDatePicker
                  control={control}
                  translation={t}
                  className="grow"
                  name="reductionEffectsStart"
                  views={['year']}
                  minDate={dayjs(reductionStartYear)}
                  fullWidth
                  data-testid="add-action-reductionEffectsStart"
                />
              </div>
            </div>
          </div>
        </>
      )}
    </>
  )
}

export default AddActionStep1
