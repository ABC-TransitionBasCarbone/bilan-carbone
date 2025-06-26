'use client'

import { signOutEnv } from '@/services/auth'
import { Environment } from '@prisma/client'
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
