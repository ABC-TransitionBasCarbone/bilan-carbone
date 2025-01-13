'use client'

import { signOut } from 'next-auth/react'
import { useEffect } from 'react'

const LogoutPage = () => {
  useEffect(() => {
    signOut()
  }, [])

  return <div />
}

export default LogoutPage
