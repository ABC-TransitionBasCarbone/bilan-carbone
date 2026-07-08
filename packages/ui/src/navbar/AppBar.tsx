'use client'

import { AppBarProps } from '@mui/material'
import classNames from 'classnames'
import styles from './AppBar.module.css'

const AppBar = ({ elevation, className, children, ...rest }: AppBarProps) => (
  <header className={classNames(styles.root, elevation === 0 ? styles.flat : styles.elevated, className)} {...rest}>
    {children}
  </header>
)

export default AppBar
