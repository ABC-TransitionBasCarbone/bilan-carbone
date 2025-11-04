import { FormSelect } from '@/components/form/Select'
import { AddActionCommand } from '@/services/serverFunctions/transitionPlan.command'
import { MenuItem } from '@mui/material'
import { ActionCategory, ActionNature, ActionRelevance } from '@prisma/client'
import { useTranslations } from 'next-intl'
import { Control } from 'react-hook-form'

interface Props {
  control: Control<AddActionCommand>
}

const ActionModalStep1 = ({ control }: Props) => {
  const t = useTranslations('study.transitionPlan.actions.addModal')
  const tNature = useTranslations('study.transitionPlan.actions.nature')
  const tCategory = useTranslations('study.transitionPlan.actions.category')
  const tRelevance = useTranslations('study.transitionPlan.actions.relevance')

  const selectors = {
    nature: { keys: Object.values(ActionNature), t: tNature },
    category: { keys: Object.values(ActionCategory), t: tCategory },
    relevance: { keys: Object.values(ActionRelevance), t: tRelevance },
  }
  type SelectorKey = keyof typeof selectors

  return (
    <>
      <FormSelect
        control={control}
        translation={t}
        name="priority"
        label={`${t('priority')} *`}
        data-testid="add-action-priority"
        fullWidth
      >
        {[7, 6, 5, 4, 3, 2, 1].map((priority) => (
          <MenuItem key={priority} value={priority}>
            {priority}
          </MenuItem>
        ))}
      </FormSelect>
      {(Object.entries(selectors) as [SelectorKey, (typeof selectors)[SelectorKey]][]).map(([selector, values]) => (
        <FormSelect
          key={selector}
          control={control}
          translation={t}
          name={selector}
          label={t(selector)}
          data-testid={`add-action-${selector}`}
          fullWidth
          multiple
        >
          {values.keys.map((key) => (
            <MenuItem key={key} value={key}>
              {values.t(key)}
            </MenuItem>
          ))}
        </FormSelect>
      ))}
    </>
  )
}

export default ActionModalStep1
