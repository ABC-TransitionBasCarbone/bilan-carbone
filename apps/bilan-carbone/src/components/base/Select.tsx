import { Translations } from '@/types/translation'
import ClearIcon from '@mui/icons-material/Clear'
import { IconButton, InputAdornment, Select as MUISelect, SelectChangeEvent, SelectProps } from '@mui/material'
import { CustomFormLabel } from '../form/CustomFormLabel'

interface Props {
  icon?: React.ReactNode
  iconPosition?: 'before' | 'after'
  clearable?: boolean
  t?: Translations
  withLabel?: boolean
}

export const Select = ({
  name,
  value,
  onChange,
  label,
  icon,
  iconPosition,
  clearable,
  withLabel = true,
  t,
  ...selectProps
}: Props & SelectProps) => {
  return (
    <>
      {label && withLabel && <CustomFormLabel label={label} icon={icon} iconPosition={iconPosition} />}
      <MUISelect
        {...selectProps}
        labelId={`${name}-select-label}`}
        value={value || ''}
        onChange={onChange}
        name={name}
        label={withLabel ? undefined : label}
        slotProps={{
          root: { sx: { borderRadius: '12px', borderColor: 'var(--grayscale-300)', color: 'black' } },
          input: { sx: { paddingRight: '0 !important' } },
        }}
        endAdornment={
          value && clearable ? (
            <InputAdornment position="end" className="mr1">
              <IconButton
                data-testid={`${name}-clear`}
                aria-label={t && t('clear')}
                onClick={() => onChange && onChange({ target: { value: '' } } as SelectChangeEvent<string>, null)}
              >
                <ClearIcon />
              </IconButton>
            </InputAdornment>
          ) : null
        }
      />
    </>
  )
}
