'use client'

import { switchEnvironment } from '@/i18n/environment'
import { CUT, Environment, useAppEnvironmentStore } from '@/store/AppEnvironment'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect } from 'react'

const RESTRICTED_ROUTES: Partial<Record<Environment, string[]>> = {
  [CUT]: ['/parametres', '/facteurs-d-emission', '/formation'],
}

const EnvironmentInitializer = () => {
  const { environment } = useAppEnvironmentStore()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    switchEnvironment(environment)
  }, [environment])

  useEffect(() => {
    const restrictedRoutes = RESTRICTED_ROUTES[environment] || []
    const isRestricted = restrictedRoutes.some((route) => pathname.startsWith(route))
    if (isRestricted) {
      router.push('/')
    }
  }, [environment, pathname])

  return <></>
}

export default EnvironmentInitializer
