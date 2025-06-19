import { Button as ButtonMUI, ButtonProps } from '@mui/material'

const Button = ({ fullWidth = false, color = 'secondary', variant = 'contained', ...rest }: ButtonProps) => {
  return <ButtonMUI color={color} fullWidth={fullWidth} variant={variant} {...rest} />
}

export default Button
