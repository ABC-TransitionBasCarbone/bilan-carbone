import { FormAutocomplete } from '@/components/form/Autocomplete'
import { FormTextField } from '@/components/form/TextField'
import GlossaryIconModal from '@/components/modals/GlossaryIconModal'
import { AddActionFormCommand } from '@/services/serverFunctions/transitionPlan.command'
import { ActionIndicatorType } from '@prisma/client'
import { useTranslations } from 'next-intl'
import { SyntheticEvent } from 'react'
import { Control, UseFormSetValue } from 'react-hook-form'
import ActionIndicatorsList from './ActionIndicatorsList'

interface Props {
  control: Control<AddActionFormCommand>
  setValue: UseFormSetValue<AddActionFormCommand>
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
      <div className="flex-col gapped-2">
        <div className="flex align-center gapped1">
          <span className="inputLabel bold">{t('indicator')}</span>
          <GlossaryIconModal
            title="indicatorTooltipTitle"
            iconLabel="indicatorTooltipLabel"
            label="indicator-tooltip"
            tModal="study.transitionPlan.actions.addModal"
          >
            <p>{t('indicatorTooltipDescription')}</p>
          </GlossaryIconModal>
        </div>
        <ActionIndicatorsList
          control={control}
          setValue={setValue}
          type={ActionIndicatorType.Implementation}
          label={t('implementation')}
        />
        <ActionIndicatorsList
          control={control}
          setValue={setValue}
          type={ActionIndicatorType.FollowUp}
          label={t('followUp')}
        />
        <ActionIndicatorsList
          control={control}
          setValue={setValue}
          type={ActionIndicatorType.Performance}
          label={t('performance')}
        />
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
