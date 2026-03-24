'use client'

import { signOutEnv } from '@/services/auth.utils'
import { Environment } from '@repo/db-common/enums'
import { useSearchParams } from 'next/navigation'
import { useEffect } from 'react'

const LogoutPage = () => {
  const searchParams = useSearchParams()

  useEffect(() => {
    signOutEnv((searchParams.get('env') as Environment) || undefined)
  }, [])

  return <div />
}

export default LogoutPage
