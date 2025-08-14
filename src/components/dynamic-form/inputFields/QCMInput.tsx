import { Checkbox, FormControl, FormControlLabel, FormHelperText, styled } from '@mui/material'
import { BaseInputProps } from '../types/formTypes'
import { formatOption } from './utils'

const StyledFormControlLabel = styled(FormControlLabel)(({ theme }) => ({
  backgroundColor: 'white',
  border: `solid 1px ${theme.custom.box.borderColor}`,
  borderRadius: '1rem',
  width: 'fit-content',
}))

export const QCMInput = ({ question, value, onChange, onBlur, errorMessage, disabled }: BaseInputProps) => {
  const selectedOptions: string[] = JSON.parse(value || '[]')

  const handleOptionChange = (option: string, checked: boolean) => {
    const newSelectedOptions = checked ? [...selectedOptions, option] : selectedOptions.filter((c) => c !== option)
    const newValue = newSelectedOptions.length > 0 ? JSON.stringify(newSelectedOptions) : JSON.stringify([])
    onChange(newValue)
  }

  return (
    <FormControl className="flex-col m2" error={!!errorMessage} disabled={disabled}>
      {question.possibleAnswers?.map((option, index) => (
        <StyledFormControlLabel
          key={`box-${index}`}
          className="p-2 pr1 flex-row align-center mb1"
          control={
            <Checkbox
              onBlur={onBlur}
              key={index}
              name={option}
              checked={selectedOptions.includes(option)}
              onChange={(e) => handleOptionChange(option, e.target.checked)}
            />
          }
          label={formatOption(option)}
        />
      ))}
      {errorMessage && <FormHelperText>{errorMessage}</FormHelperText>}
    </FormControl>
  )
}

export default QCMInput
