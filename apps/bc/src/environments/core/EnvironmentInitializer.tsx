'use client'

import { switchEnvironment } from '@/i18n/environment'
import { useAppEnvironmentStore } from '@/store/AppEnvironment'
import { UserSession } from 'next-auth'
import { useEffect } from 'react'
import EnvironmentLoader from './utils/EnvironmentLoader'

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
    return <EnvironmentLoader />
  }

  return null
}

export default EnvironmentInitializer
