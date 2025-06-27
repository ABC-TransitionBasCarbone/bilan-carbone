import { FormControl, FormControlLabel, Radio, styled } from '@mui/material'
import { useState } from 'react'
import { BaseInputProps } from '../types/formTypes'
import { formatOption } from './utils'

const StyledFormControlLabel = styled(FormControlLabel)(({ theme }) => ({
  backgroundColor: 'white',
  border: `solid 1px ${theme.custom.box.borderColor}`,
  borderRadius: '1rem',
  width: 'fit-content',
}))

const QCUInput = ({ question, errorMessage, disabled, onBlur }: BaseInputProps) => {
  const [selectedOption, setSelectedOption] = useState<string | null>()

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
              checked={selectedOption === option}
              onChange={(e) => setSelectedOption(e.target.checked ? option : null)}
            />
          }
        />
      ))}
    </FormControl>
  )
}

export default QCUInput
