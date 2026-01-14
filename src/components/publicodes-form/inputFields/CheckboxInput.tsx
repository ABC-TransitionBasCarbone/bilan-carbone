import { usePublicodesRuleTranslation } from '@/hooks/usePublicodesRuleTranslation'
import { Checkbox, FormControlLabel, styled } from '@mui/material'
import { EvaluatedCheckbox } from '@publicodes/forms'
import { OnFieldChange } from '../utils'

interface GroupCheckboxItemProps<RuleName extends string> {
  evaluatedElement: EvaluatedCheckbox<RuleName>
  index: number
  onChange: OnFieldChange<RuleName>
}

export default function GroupCheckboxItem<RuleName extends string>({
  evaluatedElement,
  index,
  onChange,
}: GroupCheckboxItemProps<RuleName>) {
  const { question } = usePublicodesRuleTranslation(evaluatedElement.id)
  const isChecked = evaluatedElement.checked ?? false
  const isDisabled = !evaluatedElement.applicable

  return (
    <StyledFormControlLabel
      key={`box-${evaluatedElement.id}-${index}`}
      className="p-2 pr1 flex-row align-center mb1"
      control={
        <Checkbox
          name={String(evaluatedElement.id)}
          checked={isChecked}
          disabled={isDisabled}
          onChange={(e) => onChange(evaluatedElement.id, e.target.checked)}
        />
      }
      label={question}
    />
  )
}

const StyledFormControlLabel = styled(FormControlLabel)(({ theme }) => ({
  backgroundColor: 'white',
  border: `solid 1px ${theme.custom.box.borderColor}`,
  borderRadius: '1rem',
  width: 'fit-content',
}))
