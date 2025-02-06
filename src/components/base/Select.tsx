import { Select as MUISelect, SelectProps, Typography } from '@mui/material'

export const Select = ({ name, label, value, onChange, ...selectProps }: SelectProps) => {
  return (
    <>
      {label && (
        <Typography id={`${name}-select-label}`} className="inputLabel">
          {label}
        </Typography>
      )}
      <MUISelect
        {...selectProps}
        labelId={`${name}-select-label}`}
        value={value || ''}
        onChange={onChange}
        name={name}
        slotProps={{
          root: { sx: { borderRadius: '12px', borderColor: 'var(--color-grey-400)', color: 'var(--color-grey-950)' } },
        }}
      />
    </>
  )
}
