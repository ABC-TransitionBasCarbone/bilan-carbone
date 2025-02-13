'use client'

import { SessionProvider } from 'next-auth/react'
import Profile from '../profile/Profile'

export interface Props {
  version: string
}

const ProfilePage = ({ version }: Props) => {
  return (
    <SessionProvider>
      <Profile version={version} />
    </SessionProvider>
  )
}

export default ProfilePage
