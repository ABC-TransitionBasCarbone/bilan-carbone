import { FormControl, FormHelperText, MenuItem, Select, SelectChangeEvent } from '@mui/material'
import { BaseInputProps } from '../types/formTypes'
import { formatOption } from './utils'

interface SelectInputProps extends Omit<BaseInputProps, 'value' | 'onChange'> {
  value: string | null
  onChange: (value: string | null) => void
}

const SelectInput = ({ question, value, onChange, onBlur, errorMessage, disabled }: SelectInputProps) => {
  const options = question.possibleAnswers || []

  const handleChange = (event: SelectChangeEvent<string>) => {
    onChange(event.target.value)
  }

  return (
    <FormControl fullWidth error={!!errorMessage} disabled={disabled}>
      <Select value={value || ''} onChange={handleChange} onBlur={onBlur}>
        {options.map((option) => (
          <MenuItem key={option} value={option}>
            {formatOption(option)}
          </MenuItem>
        ))}
      </Select>
      {errorMessage && <FormHelperText>{errorMessage}</FormHelperText>}
    </FormControl>
  )
}

export default SelectInput
