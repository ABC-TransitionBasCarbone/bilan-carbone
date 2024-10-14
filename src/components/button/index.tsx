import React from 'react'
import { Button as ButtonMUI, ButtonProps } from '@mui/material'
import styles from './styles.module.css'
import classNames from 'classnames'

const Button = ({ className, ...rest }: ButtonProps) => {
  return <ButtonMUI className={classNames(styles.button, className)} {...rest} />
}

export default Button
