import classNames from 'classnames'
import React, { FormHTMLAttributes } from 'react'
import styles from './Form.module.css'

const Form = ({ className, ...props }: FormHTMLAttributes<HTMLFormElement>) => {
  return <form className={classNames(styles.form, 'flex-col', className)} {...props} />
}

export default Form
