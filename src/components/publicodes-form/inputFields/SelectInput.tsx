import { FormControl, FormHelperText, MenuItem, Select, SelectChangeEvent, Typography } from '@mui/material'
import { styled } from '@mui/material/styles'
import { EvaluatedSelect } from '@publicodes/forms'
import styles from '../styles/DynamicForm.module.css'
import { BaseInputProps } from './utils'

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

interface SelectInputProps<RuleName extends string> extends BaseInputProps<RuleName> {
  formElement: EvaluatedSelect<RuleName>
}

const SelectInput = <RuleName extends string>({
  formElement,
  onChange,
  onBlur,
  errorMessage,
  disabled,
  // TODO: handle table
  // table,
}: SelectInputProps<RuleName>) => {
  const handleChange = (event: SelectChangeEvent<string>) => {
    onChange(formElement.id, event.target.value)
  }

  if (disabled && formElement.value) {
    return (
      <StyledFormControl fullWidth error={!!errorMessage}>
        <DisabledText variant="body1">{formElement.value}</DisabledText>
        {errorMessage && <FormHelperText>{errorMessage}</FormHelperText>}
      </StyledFormControl>
    )
  }

  return (
    <StyledFormControl fullWidth error={!!errorMessage} disabled={disabled}>
      <Select
        value={formElement.value ?? formElement.defaultValue ?? ''}
        onChange={handleChange}
        onBlur={onBlur}
        MenuProps={{
          PaperProps: {
            className: `${styles.selectMenuPaper} ${styles.normal}`,
          },
        }}
      >
        {formElement.options.map((option) => (
          <MenuItem
            key={option.label}
            value={typeof option.value === 'boolean' ? (option.value ? 'oui' : 'non') : option.value}
            className={styles.selectMenuItem}
          >
            {option.label}
          </MenuItem>
        ))}
      </Select>
      {errorMessage && <FormHelperText>{errorMessage}</FormHelperText>}
    </StyledFormControl>
  )
}

export default SelectInput
