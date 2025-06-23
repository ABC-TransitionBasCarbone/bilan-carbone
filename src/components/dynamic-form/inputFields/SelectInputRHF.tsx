import { FormControl, FormHelperText, MenuItem, Select, SelectChangeEvent } from '@mui/material'
import { BaseInputProps } from '../types/formTypes'

interface SelectInputRHFProps extends Omit<BaseInputProps, 'value' | 'onChange'> {
  value: string | null
  onChange: (value: string | null) => void
}

const SelectInputRHF = ({ question, value, onChange, onBlur, errorMessage, disabled }: SelectInputRHFProps) => {
  const options = question.possibleAnswers || []

  const handleChange = (event: SelectChangeEvent<string>) => {
    onChange(event.target.value)
  }

  return (
    <FormControl fullWidth error={!!errorMessage} disabled={disabled}>
      <Select value={value || ''} onChange={handleChange} onBlur={onBlur}>
        {options.map((option) => (
          <MenuItem key={option} value={option}>
            {option}
          </MenuItem>
        ))}
      </Select>
      {errorMessage && <FormHelperText>{errorMessage}</FormHelperText>}
    </FormControl>
  )
}

export default SelectInputRHF
