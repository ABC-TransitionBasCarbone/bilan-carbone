import { Checkbox, FormControl, FormControlLabel, FormHelperText, styled } from '@mui/material'
import { useState } from 'react'
import { BaseInputProps } from '../types/formTypes'

const StyledFormControlLabel = styled(FormControlLabel)(({ theme }) => ({
  backgroundColor: 'white',
  border: `solid 1px ${theme.custom.box.borderColor}`,
  borderRadius: '1rem',
  width: 'fit-content',
}))

export const QCMInput = ({ question, onBlur, errorMessage, disabled }: BaseInputProps) => {
  const [selectedOptions, setSelectedOptions] = useState<string[]>([])

  return (
    <FormControl className="flex flex-col m2" error={!!errorMessage} disabled={disabled}>
      {question.possibleAnswers?.map((option, index) => (
        <StyledFormControlLabel
          key={`box-${index}`}
          className="p-2 pr1 flex flex-row align-center mb1"
          control={
            <Checkbox
              onBlur={onBlur}
              key={index}
              name={option}
              checked={selectedOptions.includes(option)}
              onChange={(e) => {
                setSelectedOptions((oldValues) => {
                  const newValues = e.target.checked ? [...oldValues, option] : oldValues.filter((c) => c !== option)
                  return newValues
                })
              }}
            />
          }
          label={option}
        />
      ))}
      {errorMessage && <FormHelperText>{errorMessage}</FormHelperText>}
    </FormControl>
  )
}

export default QCMInput
