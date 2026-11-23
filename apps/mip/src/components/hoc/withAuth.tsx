import { auth } from '@/services/auth'
import { UserSession } from 'next-auth'
import { redirect } from 'next/navigation'
import React from 'react'

export type UserSessionProps = {
  user: UserSession
}

const withAuth = (WrappedComponent: React.ComponentType<any & UserSessionProps>) => {
  const Component = async (props: any) => {
    const session = await auth()
    if (!session || !session.user) {
      redirect('/login')
    }

    return <WrappedComponent {...props} user={session.user} />
  }
  Component.displayName = 'WithAuth'
  return Component
}

export default withAuth
