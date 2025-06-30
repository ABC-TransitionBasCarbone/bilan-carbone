'use client'

import { CircularProgress } from '@mui/material'
import styles from './EnvironmentLoader.module.css'

const EnvironmentLoader = () => (
  <div className={styles.loading}>
    <CircularProgress className={styles.circular} variant="indeterminate" color="primary" />
  </div>
)

export default EnvironmentLoader
