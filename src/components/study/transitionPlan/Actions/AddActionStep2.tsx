import { FormSelect } from '@/components/form/Select'
import { AddActionCommand, AddActionCommandBase } from '@/services/serverFunctions/study.command'
import { MenuItem } from '@mui/material'
import { useTranslations } from 'next-intl'
import { Control } from 'react-hook-form'

interface Props {
  control: Control<AddActionCommand>
}

const selectors = {
  nature: AddActionCommandBase.shape.nature.element.options,
  category: AddActionCommandBase.shape.category.element.options,
  relevance: AddActionCommandBase.shape.relevance.element.options,
}
type SelectorKey = keyof typeof selectors

const AddActionStep1 = ({ control }: Props) => {
  const t = useTranslations('study.transitionPlan.actions.addModal')

  return (
    <>
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
          {values.map((key) => (
            <MenuItem key={key} value={key}>
              {t(key)}
            </MenuItem>
          ))}
        </FormSelect>
      ))}
    </>
  )
}

export default AddActionStep1
