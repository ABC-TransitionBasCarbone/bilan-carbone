import { emissionFactorDefautQualityStar } from '@/utils/emissionFactors'
import { FormControl, InputLabel, MenuItem, SelectProps } from '@mui/material'
import { useTranslations } from 'next-intl'
import { Select } from '../base/Select'

interface Props {
  formControlClassName?: string
  starredValue?: number | null
  clearable?: boolean
}

const QualitySelect = ({
  formControlClassName,
  starredValue,
  clearable,
  error,
  ...props
}: Props & Omit<SelectProps, 'options' | 'labelId'>) => {
  const t = useTranslations('quality')
  console.log('props : ', props)

  return (
    <FormControl error={error} className={formControlClassName}>
      <InputLabel id={`${props.id}-label}`}>{props.label}</InputLabel>
      <Select {...props} labelId={`${props.id}-label}`} withLabel={false} clearable={clearable}>
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
