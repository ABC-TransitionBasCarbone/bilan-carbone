import { FormControl, FormHelperText, MenuItem, Select, SelectChangeEvent } from '@mui/material'
import { BaseInputProps } from '../dynamic-form/types/formTypes'

interface SelectInputRHFProps extends BaseInputProps {
  value: string | string[]
  label?: string
  multiple?: boolean
}

const SelectInputRHF = ({
  question,
  value,
  onChange,
  onBlur,
  error,
  disabled,
  multiple = false,
}: SelectInputRHFProps) => {
  const options = question.possibleAnswers || []

  const handleChange = (event: SelectChangeEvent<string | string[]>) => {
    onChange(event.target.value)
  }

  return (
    <FormControl fullWidth error={!!error} disabled={disabled}>
      <Select value={value || (multiple ? [] : '')} onChange={handleChange} onBlur={onBlur} multiple={multiple}>
        {options.map((option) => (
          <MenuItem key={option} value={option}>
            {option}
          </MenuItem>
        ))}
      </Select>
      {error && <FormHelperText>{error}</FormHelperText>}
    </FormControl>
  )
}

export default SelectInputRHF
