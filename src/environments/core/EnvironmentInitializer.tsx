'use client'

import { switchEnvironment } from '@/i18n/environment'
import { useAppEnvironmentStore } from '@/store/AppEnvironment'
import { UserSession } from 'next-auth'
import { useEffect } from 'react'

const EnvironmentInitializer = ({ user }: { user: UserSession }) => {
  const { setEnvironment } = useAppEnvironmentStore()

  useEffect(() => {
    if (!user || !user.environment) {
      return
    }
    setEnvironment(user.environment)
    switchEnvironment(user.environment)
  }, [user?.environment])

  return <></>
}

export default EnvironmentInitializer
