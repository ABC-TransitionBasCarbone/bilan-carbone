'use client'

import Profile from '../profile/Profile'

interface Props {
  version: string
}

const ProfilePage = ({ version }: Props) => {
  return <Profile version={version} />
}

export default ProfilePage
