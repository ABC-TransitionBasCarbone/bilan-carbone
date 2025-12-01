import { FormControl, FormControlLabel, Radio, styled } from '@mui/material'
import { EvaluatedRadioGroup } from '@publicodes/forms'
import { BaseInputProps } from './utils'

const StyledFormControlLabel = styled(FormControlLabel)(({ theme }) => ({
  backgroundColor: 'white',
  border: `solid 1px ${theme.custom.box.borderColor}`,
  borderRadius: '1rem',
  width: 'fit-content',
}))

interface RadioGroupInputProps<RuleName extends string> extends BaseInputProps<RuleName> {
  formElement: EvaluatedRadioGroup<RuleName>
}

const RadioGroupInput = <RuleName extends string>({
  formElement,
  onChange,
  onBlur,
  errorMessage,
  disabled,
}: RadioGroupInputProps<RuleName>) => {
  return (
    <FormControl className="flex-row m2 gapped1" error={!!errorMessage} disabled={disabled}>
      {formElement.options.map((option, index) => (
        <StyledFormControlLabel
          key={`box-${index}`}
          className="p-2 pr1 flex-row align-center mb1"
          label={option.label}
          control={
            <Radio
              onBlur={onBlur}
              key={index}
              name={option.label}
              checked={formElement.value === option.value}
              onChange={(e) => onChange(formElement.id, e.target.checked ? option.value : undefined)}
            />
          }
        />
      ))}
    </FormControl>
  )
}

export default RadioGroupInput
