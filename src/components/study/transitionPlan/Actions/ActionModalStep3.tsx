import { FormAutocomplete } from '@/components/form/Autocomplete'
import { FormTextField } from '@/components/form/TextField'
import { AddActionCommand } from '@/services/serverFunctions/transitionPlan.command'
import { useTranslations } from 'next-intl'
import { SyntheticEvent } from 'react'
import { Control, UseFormSetValue } from 'react-hook-form'

interface Props {
  control: Control<AddActionCommand>
  setValue: UseFormSetValue<AddActionCommand>
  organizationMembers: { label: string; value: string }[]
}

const ActionModalStep3 = ({ control, setValue, organizationMembers }: Props) => {
  const t = useTranslations('study.transitionPlan.actions.addModal')

  const onOwnerChange = (_: SyntheticEvent, value: string | null) => {
    setValue('owner', value?.trim() || '')
  }

  return (
    <>
      <FormAutocomplete
        control={control}
        translation={t}
        options={organizationMembers}
        getOptionLabel={(option) => (typeof option === 'string' ? option : option.label)}
        filterOptions={(options, { inputValue }) =>
          options.filter((option) =>
            typeof option === 'string' ? option : option.label.toLowerCase().includes(inputValue.toLowerCase()),
          )
        }
        name="owner"
        label={t('owner')}
        onInputChange={onOwnerChange}
        freeSolo
        data-testid="add-action-owner"
      />
      <FormTextField
        type="number"
        control={control}
        name="necessaryBudget"
        label={t('necessaryBudget')}
        placeholder={t('necessaryBudgetPlaceholder')}
        data-testid="add-action-necessaryBudget"
      />
      <FormTextField
        control={control}
        name="necesssaryRessources"
        label={t('necesssaryRessources')}
        placeholder={t('necesssaryRessourcesPlaceholder')}
        fullWidth
        multiline
        data-testid="add-action-necesssaryRessources"
      />
      <span className="inputLabel bold">{t('indicator')}</span>
      <div className="flex-col">
        <span className="inputLabel bold mb-2">{t('implementation')}</span>
        <div className="flex grow gapped">
          <FormTextField
            control={control}
            name="implementationDescription"
            placeholder={t('indicatorDescriptionPlaceholder')}
            fullWidth
            data-testid="add-action-implementationDescription"
          />
          <FormTextField
            type="number"
            control={control}
            name="implementationGoal"
            placeholder={t('indicatorGoalPlaceholder')}
            data-testid="add-action-implementationGoal"
          />
        </div>
      </div>
      <div className="flex-col">
        <span className="inputLabel bold mb-2">{t('followUp')}</span>
        <div className="flex grow gapped">
          <FormTextField
            control={control}
            name="followUpDescription"
            placeholder={t('indicatorDescriptionPlaceholder')}
            fullWidth
            data-testid="add-action-followUpDescription"
          />
          <FormTextField
            type="number"
            control={control}
            name="followUpGoal"
            placeholder={t('indicatorGoalPlaceholder')}
            data-testid="add-action-followUpGoal"
          />
        </div>
      </div>
      <div className="flex-col">
        <span className="inputLabel bold mb-2">{t('performance')}</span>
        <div className="flex grow gapped">
          <FormTextField
            control={control}
            name="performanceDescription"
            placeholder={t('indicatorDescriptionPlaceholder')}
            fullWidth
            data-testid="add-action-performanceDescription"
          />
          <FormTextField
            type="number"
            control={control}
            name="performanceGoal"
            placeholder={t('indicatorGoalPlaceholder')}
            data-testid="add-action-performanceGoal"
          />
        </div>
      </div>
      <FormTextField
        control={control}
        name="facilitatorsAndObstacles"
        label={t('facilitatorsAndObstacles')}
        multiline
        data-testid="add-action-facilitatorsAndObstacles"
      />
      <FormTextField
        control={control}
        name="additionalInformation"
        label={t('additionalInformation')}
        multiline
        data-testid="add-action-additionalInformation"
      />
    </>
  )
}

export default ActionModalStep3
