import { Button as ButtonMUI, ButtonProps } from '@mui/material'
import classNames from 'classnames'
import styles from './Button.module.css'

const Button = ({ className, fullWidth, ...rest }: ButtonProps) => {
  return (
    <ButtonMUI
      className={classNames(styles.button, className, {
        [styles.secondary]: rest.color === 'secondary',
        [styles.error]: rest.color === 'error',
        w100: fullWidth,
      })}
      {...rest}
    />
  )
}

export default Button
