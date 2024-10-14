import classNames from 'classnames'
import { Input as InputMUI, InputProps } from '@mui/material'
import React from 'react'
import styles from './styles.module.css'

const Input = ({ className, ...rest }: InputProps) => {
  return <InputMUI className={classNames(styles.input, className)} {...rest} />
}

export default Input
