import { FormControl, InputLabel, MenuItem, Select, SelectProps } from '@mui/material'
import { useTranslations } from 'next-intl'
import React from 'react'

const QualitySelect = ({ ...props }: Omit<SelectProps, 'options' | 'labelId'>) => {
  const t = useTranslations('quality')
  return (
    <FormControl>
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
