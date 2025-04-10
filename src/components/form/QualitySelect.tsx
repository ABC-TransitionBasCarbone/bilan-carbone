import { emissionFactorDefautQualityStar } from '@/utils/emissionFactors'
import { FormControl, InputLabel, MenuItem, Select, SelectProps } from '@mui/material'
import { useTranslations } from 'next-intl'

interface Props {
  formControlClassName?: string
  starredValue?: number | null
}

const QualitySelect = ({
  formControlClassName,
  starredValue,
  ...props
}: Props & Omit<SelectProps, 'options' | 'labelId'>) => {
  const t = useTranslations('quality')
  return (
    <FormControl className={formControlClassName}>
      <InputLabel id={`${props.id}-label}`}>{props.label}</InputLabel>
      <Select {...props} labelId={`${props.id}-label}`}>
        {Array.from({ length: 5 }).map((_, index) => (
          <MenuItem key={index} value={index + 1}>
            {t((index + 1).toString())} {starredValue === index + 1 && <>{emissionFactorDefautQualityStar}</>}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  )
}

export default QualitySelect
