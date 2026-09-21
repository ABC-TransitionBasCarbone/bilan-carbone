'use client'

import { SessionProvider } from 'next-auth/react'
import Profile from '../profile/Profile'

interface Props {
  version: string
  feedbackFormUrl: string
}

const ProfilePage = ({ version, feedbackFormUrl }: Props) => {
  return (
    <SessionProvider>
      <Profile version={version} feedbackFormUrl={feedbackFormUrl} />
    </SessionProvider>
  )
}

export default ProfilePage
