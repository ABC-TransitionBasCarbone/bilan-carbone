import { FormDatePicker } from '@/components/form/DatePicker'
import { FormSelect } from '@/components/form/Select'
import { FormTextField } from '@/components/form/TextField'
import { AddActionCommand } from '@/services/serverFunctions/study.command'
import { MenuItem, TextField } from '@mui/material'
import { ActionPotentialDeduction } from '@prisma/client'
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
  const tDeduction = useTranslations('study.transitionPlan.actions.potentialDeduction')
  const potentialDeduction = useWatch({ control, name: 'potentialDeduction' })
  const reductionStartYear = useWatch({ control, name: 'reductionStartYear' })
  const reductionEndYear = useWatch({ control, name: 'reductionEndYear' })

  useEffect(() => {
    if (reductionStartYear && reductionEndYear && dayjs(reductionStartYear).year() > dayjs(reductionEndYear).year()) {
      setValue('reductionEndYear', reductionStartYear)
    }
  }, [reductionStartYear, reductionEndYear, setValue])

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
        {Object.values(ActionPotentialDeduction).map((potential) => (
          <MenuItem key={potential} value={potential} disabled={potential === ActionPotentialDeduction.EmissionSources}>
            {tDeduction(potential)}
          </MenuItem>
        ))}
      </FormSelect>
      {potentialDeduction === ActionPotentialDeduction.Quantity && (
        <>
          <div className=" flex-col grow">
            <span className="inputLabel bold mb-2">{`${t('reductionValue')} *`}</span>
            <div className="flex grow relative">
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
              <div className="flex grow relative">
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
              <span className="inputLabel bold mb-2">{`${t('reductionEndYear')} *`}</span>
              <div className="flex grow relative">
                <FormDatePicker
                  control={control}
                  translation={t}
                  className="grow"
                  name="reductionEndYear"
                  views={['year']}
                  minDate={dayjs(reductionStartYear)}
                  fullWidth
                  data-testid="add-action-reductionEndYear"
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
