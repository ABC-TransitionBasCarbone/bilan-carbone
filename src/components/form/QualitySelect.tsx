import { FormControl, InputLabel, MenuItem, Select, SelectProps } from '@mui/material'
import { useTranslations } from 'next-intl'

const QualitySelect = ({
  formControlClassName,
  ...props
}: Omit<SelectProps, 'options' | 'labelId'> & { formControlClassName?: string }) => {
  const t = useTranslations('quality')
  return (
    <FormControl className={formControlClassName}>
      <InputLabel id={`${props.id}-label}`}>{props.label}</InputLabel>
      <Select {...props} labelId={`${props.id}-label}`}>
        {Array.from({ length: 5 }).map((_, index) => (
          <MenuItem key={index} value={index + 1}>
            {t((index + 1).toString())}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  )
}

export default QualitySelect
