'use client'

import { switchEnvironment } from '@/i18n/environment'
import { useAppEnvironmentStore } from '@/store/AppEnvironment'
import { Environment } from '@prisma/client'
import { UserSession } from 'next-auth'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect } from 'react'

// TODO retrun not found in pages with sesion env

const RESTRICTED_ROUTES: Partial<Record<Environment, string[]>> = {
  [Environment.CUT]: ['/parametres', '/facteurs-d-emission', '/formation'],
}

const EnvironmentInitializer = ({ user }: { user: UserSession }) => {
  const { environment, setEnvironment } = useAppEnvironmentStore()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (!user || !user.environment) {
      return
    }
    setEnvironment(user.environment)
    switchEnvironment(user.environment)
  }, [user?.environment])

  useEffect(() => {
    const restrictedRoutes = RESTRICTED_ROUTES[environment || Environment.BC] || []
    const isRestricted = restrictedRoutes.some((route) => pathname.startsWith(route))
    if (isRestricted) {
      router.push('/')
    }
  }, [environment, pathname])

  return <></>
}

export default EnvironmentInitializer
