'use client'

import { switchEnvironment } from '@/i18n/environment'
import { useAppEnvironmentStore } from '@/store/AppEnvironment'
import { useEffect } from 'react'

const EnvironmentInitializer = () => {
  const { environment } = useAppEnvironmentStore()

  useEffect(() => {
    switchEnvironment(environment)
  }, [environment])

  return <></>
}

export default EnvironmentInitializer
