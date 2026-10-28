import { Typography } from '@mui/material'
import classNames from 'classnames'
import IconLabel from '../ui/base/IconLabel'

interface Props {
  label: React.ReactNode
  icon?: React.ReactNode
  iconPosition?: 'before' | 'after'
  className?: string
  required?: boolean
}

export const CustomFormLabel = ({ label, icon, iconPosition, className, required }: Props) => {
  const content = (
    <>
      {label}
      {required && <span aria-hidden="true"> *</span>}
    </>
  )

  if (icon) {
    return (
      <IconLabel icon={icon} iconPosition={iconPosition} className={classNames('mb-2', className)}>
        <Typography fontWeight="bold">{content}</Typography>
      </IconLabel>
    )
  }

  return (
    <Typography fontWeight="bold" className={classNames('mb-2', className)}>
      {content}
    </Typography>
  )
}
