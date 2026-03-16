import { Typography } from '@mui/material'
import classNames from 'classnames'
import IconLabel from '../base/IconLabel'

interface Props {
  label: React.ReactNode
  icon?: React.ReactNode
  iconPosition?: 'before' | 'after'
  className?: string
}

export const CustomFormLabel = ({ label, icon, iconPosition, className }: Props) => {
  if (icon) {
    return (
      <IconLabel icon={icon} iconPosition={iconPosition} className={classNames('mb-2', className)}>
        <Typography fontWeight="bold">{label}</Typography>
      </IconLabel>
    )
  }

  return (
    <Typography fontWeight="bold" className={classNames('mb-2', className)}>
      {label}
    </Typography>
  )
}
