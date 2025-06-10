'use client'

import { switchEnvironment } from '@/i18n/environment'
import { useAppEnvironmentStore } from '@/store/AppEnvironment'
import { CircularProgress } from '@mui/material'
import { UserSession } from 'next-auth'
import { useEffect } from 'react'
import styles from './EnvironmentInitializer.module.css'

const EnvironmentInitializer = ({ user }: { user: UserSession }) => {
  const { setEnvironment, setIsLoading, isLoading } = useAppEnvironmentStore()

  useEffect(() => {
    if (!user || !user.environment) {
      return
    }
    setEnvironment(user.environment)
    switchEnvironment(user.environment)
    setIsLoading(false)
  }, [user?.environment])

  if (isLoading) {
    return (
      <div className={styles.loading}>
        <CircularProgress variant="indeterminate" color="primary" size={200} />
      </div>
    )
  }

  return null
}

export default EnvironmentInitializer
