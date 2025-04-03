import { Select as MUISelect, SelectProps } from '@mui/material'
import IconLabel from './IconLabel'

interface Props {
  icon?: React.ReactNode
  iconPosition?: 'before' | 'after'
}

export const Select = ({ name, value, onChange, label, icon, iconPosition, ...selectProps }: Props & SelectProps) => {
  return (
    <>
      {label && (
        <IconLabel icon={icon} iconPosition={iconPosition} className="mb-2">
          <span className="inputLabel bold">{label}</span>
        </IconLabel>
      )}
      <MUISelect
        {...selectProps}
        labelId={`${name}-select-label}`}
        value={value || ''}
        onChange={onChange}
        name={name}
        slotProps={{
          root: { sx: { borderRadius: '12px', borderColor: 'var(--grayscale-300)', color: 'black' } },
        }}
      />
    </>
  )
}
