import { Button as ButtonMUI, ButtonProps } from '@mui/material'
import classNames from 'classnames'
import styles from './Button.module.css'

const Button = ({ className, color, ...rest }: ButtonProps) => {
  return <ButtonMUI className={classNames(styles.button, className, { [styles.error]: color === 'error' })} {...rest} />
}

export default Button
