'use client'

import { SessionProvider } from 'next-auth/react'
import Profile from '../profile/Profile'

export interface ProfilePageProps {
  version: string
}

const ProfilePage = ({ version }: ProfilePageProps) => {
  return (
    <SessionProvider>
      <Profile version={version} />
    </SessionProvider>
  )
}

export default ProfilePage
