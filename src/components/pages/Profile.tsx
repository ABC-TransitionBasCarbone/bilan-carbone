'use client'

import { SessionProvider } from 'next-auth/react'
import Profile from '../profile/Profile'

const ProfilePage = () => {
  return (
    <SessionProvider>
      <Profile />
    </SessionProvider>
  )
}

export default ProfilePage
