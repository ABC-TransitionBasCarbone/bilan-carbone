import classNames from 'classnames'
import { Input as InputMUI, InputProps } from '@mui/material'
import React, { InputHTMLAttributes } from 'react'
import styles from './Input.module.css'

const Input = ({ className, ...rest }: InputProps & InputHTMLAttributes<HTMLInputElement>) => {
  return <InputMUI className={classNames(styles.input, className)} {...rest} />
}

export default Input
