import { FormControl, FormHelperText, MenuItem, Select, SelectChangeEvent, Typography } from '@mui/material'
import { styled } from '@mui/material/styles'
import styles from '../DynamicForm.module.css'
import { BaseInputProps } from '../types/formTypes'
import { formatOption } from './utils'

const DisabledText = styled(Typography)({
  padding: '0.5rem 0.75rem',
  minHeight: '1.25rem',
})

const StyledFormControl = styled(FormControl, {
  shouldForwardProp: (prop) => prop !== 'table',
})<{ table?: boolean }>(({ table }) => ({
  maxWidth: table ? '12.5rem' : '100%',
  width: '100%',
  boxSizing: 'border-box',
}))

interface SelectInputProps extends Omit<BaseInputProps, 'value' | 'onChange'> {
  value: string | null
  onChange: (value: string | null) => void
  table?: boolean
}

const SelectInput = ({ question, value, onChange, onBlur, errorMessage, disabled, table }: SelectInputProps) => {
  const options = question.possibleAnswers || []

  const handleChange = (event: SelectChangeEvent<string>) => {
    onChange(event.target.value)
  }

  if (disabled && value) {
    return (
      <StyledFormControl fullWidth error={!!errorMessage} table={table}>
        <DisabledText variant="body1">{formatOption(value)}</DisabledText>
        {errorMessage && <FormHelperText>{errorMessage}</FormHelperText>}
      </StyledFormControl>
    )
  }

  return (
    <StyledFormControl fullWidth error={!!errorMessage} disabled={disabled} table={table}>
      <Select
        value={value || ''}
        onChange={handleChange}
        onBlur={onBlur}
        MenuProps={{
          PaperProps: {
            className: `${styles.selectMenuPaper} ${table ? styles.table : styles.normal}`,
          },
        }}
      >
        {options.map((option) => (
          <MenuItem key={option} value={option} className={styles.selectMenuItem}>
            {formatOption(option)}
          </MenuItem>
        ))}
      </Select>
      {errorMessage && <FormHelperText>{errorMessage}</FormHelperText>}
    </StyledFormControl>
  )
}

export default SelectInput
