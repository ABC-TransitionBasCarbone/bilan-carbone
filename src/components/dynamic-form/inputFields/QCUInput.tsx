import { FormControl, FormControlLabel, Radio, styled } from '@mui/material'
import { BaseInputProps } from '../types/formTypes'
import { formatOption } from './utils'

const StyledFormControlLabel = styled(FormControlLabel)(({ theme }) => ({
  backgroundColor: 'white',
  border: `solid 1px ${theme.custom.box.borderColor}`,
  borderRadius: '1rem',
  width: 'fit-content',
}))

const QCUInput = ({ question, value, onChange, onBlur, errorMessage, disabled }: BaseInputProps) => {
  return (
    <FormControl className="flex flex-row m2 gapped1" error={!!errorMessage} disabled={disabled}>
      {question.possibleAnswers.map((option, index) => (
        <StyledFormControlLabel
          key={`box-${index}`}
          className="p-2 pr1 flex flex-row align-center mb1"
          label={formatOption(option)}
          control={
            <Radio
              onBlur={onBlur}
              key={index}
              name={option}
              checked={value === option}
              onChange={(e) => onChange(e.target.checked ? option : null)}
            />
          }
        />
      ))}
    </FormControl>
  )
}

export default QCUInput
