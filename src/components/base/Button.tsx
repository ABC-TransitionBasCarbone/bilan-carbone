import { Button as ButtonMUI, ButtonProps } from '@mui/material'

const Button = ({ className, fullWidth, ...rest }: ButtonProps) => {
  return <ButtonMUI fullWidth={fullWidth} {...rest} />
}

export default Button
