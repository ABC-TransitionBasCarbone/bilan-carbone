import { Button as ButtonMUI, ButtonProps } from '@mui/material'
import styles from './Button.module.css'

interface CustomButtonProps extends ButtonProps {
  isLarge?: boolean
}

const Button = ({
  fullWidth = false,
  color = 'secondary',
  variant = 'contained',
  isLarge = false,
  className,
  ...rest
}: CustomButtonProps) => {
  const classes = [className, isLarge && styles.large].filter(Boolean).join(' ')

  return <ButtonMUI color={color} fullWidth={fullWidth} variant={variant} className={classes} {...rest} />
}

export default Button
