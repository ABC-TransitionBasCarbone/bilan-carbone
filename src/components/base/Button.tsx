import { Button as ButtonMUI, ButtonProps } from '@mui/material'
import classNames from 'classnames'
import styles from './Button.module.css'

const Button = ({ className, fullWidth, ...rest }: ButtonProps) => {
  return (
    <ButtonMUI
      fullWidth={fullWidth}
      {...rest}
    />
  )
}

export default Button
