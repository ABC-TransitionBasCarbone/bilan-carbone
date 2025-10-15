import { FormAutocomplete } from '@/components/form/Autocomplete'
import { FormTextField } from '@/components/form/TextField'
import { AddActionCommand } from '@/services/serverFunctions/study.command'
import { useTranslations } from 'next-intl'
import { SyntheticEvent } from 'react'
import { Control, UseFormSetValue } from 'react-hook-form'

interface Props {
  control: Control<AddActionCommand>
  setValue: UseFormSetValue<AddActionCommand>
  porters: { label: string; value: string }[]
}

const AddActionStep1 = ({ control, setValue, porters }: Props) => {
  const t = useTranslations('study.transitionPlan.actions.addModal')

  const onPorterChange = (_: SyntheticEvent, value: string | null) => {
    setValue('actionPorter', value?.trim() || '')
  }

  return (
    <>
      <FormAutocomplete
        control={control}
        translation={t}
        options={porters}
        getOptionLabel={(option) => (typeof option === 'string' ? option : option.label)}
        filterOptions={(options, { inputValue }) =>
          options.filter((option) =>
            typeof option === 'string' ? option : option.label.toLowerCase().includes(inputValue.toLowerCase()),
          )
        }
        name="actionPorter"
        label={t('actionPorter')}
        onInputChange={onPorterChange}
        freeSolo
        data-testid="add-action-actionPorter"
      />
      <FormTextField
        type="number"
        control={control}
        translation={t}
        name="necessaryBudget"
        label={t('necessaryBudget')}
        placeholder={t('necessaryBudgetPlaceholder')}
        data-testid="add-action-necessaryBudget"
      />
      <FormTextField
        control={control}
        translation={t}
        name="necesssaryRessources"
        label={t('necesssaryRessources')}
        placeholder={t('necesssaryRessourcesPlaceholder')}
        fullWidth
        data-testid="add-action-necesssaryRessources"
      />
      <span className="inputLabel bold">{t('indicator')}</span>
      <div className="flex-col">
        <span className="inputLabel bold mb-2">{t('implementation')}</span>
        <div className="flex grow gapped">
          <FormTextField
            control={control}
            translation={t}
            name="implementationDescription"
            placeholder={t('indicatorDescriptionPlaceholder')}
            fullWidth
            data-testid="add-action-implementationDescription"
          />
          <FormTextField
            type="number"
            control={control}
            translation={t}
            name="implementationAim"
            placeholder={t('indicatorAimPlaceholder')}
            data-testid="add-action-implementationAim"
          />
        </div>
      </div>
      <div className="flex-col">
        <span className="inputLabel bold mb-2">{t('followUp')}</span>
        <div className="flex grow gapped">
          <FormTextField
            control={control}
            translation={t}
            name="followUpDescription"
            placeholder={t('indicatorDescriptionPlaceholder')}
            fullWidth
            data-testid="add-action-followUpDescription"
          />
          <FormTextField
            type="number"
            control={control}
            translation={t}
            name="followUpAim"
            placeholder={t('indicatorAimPlaceholder')}
            data-testid="add-action-followUpAim"
          />
        </div>
      </div>
      <div className="flex-col">
        <span className="inputLabel bold mb-2">{t('performance')}</span>
        <div className="flex grow gapped">
          <FormTextField
            control={control}
            translation={t}
            name="performanceDescription"
            placeholder={t('indicatorDescriptionPlaceholder')}
            fullWidth
            data-testid="add-action-performanceDescription"
          />
          <FormTextField
            type="number"
            control={control}
            translation={t}
            name="performanceAim"
            placeholder={t('indicatorAimPlaceholder')}
            data-testid="add-action-performanceAim"
          />
        </div>
      </div>
      <FormTextField
        control={control}
        translation={t}
        name="facilitatorsAndObstacles"
        label={t('facilitatorsAndObstacles')}
        data-testid="add-action-facilitatorsAndObstacles"
      />
      <FormTextField
        control={control}
        translation={t}
        name="additionalInformation"
        label={t('additionalInformation')}
        data-testid="add-action-additionalInformation"
      />
    </>
  )
}

export default AddActionStep1
