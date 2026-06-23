'use client'

import { signOutEnv } from '@abc-transitionbascarbone/services/auth/auth.utils'
import { useEffect } from 'react'

const LogoutPage = () => {
  useEffect(() => {
    signOutEnv()
  }, [])

  return <div />
}

export default LogoutPage
