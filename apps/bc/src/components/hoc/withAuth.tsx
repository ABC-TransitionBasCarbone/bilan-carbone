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
    if (!session || !session.user || session.sessionInvalid) {
      redirect('/login')
    }

    if (session.user.needsAccountSelection) {
      redirect('/selection-du-compte')
    }

    return <WrappedComponent {...props} user={session.user} />
  }
  Component.displayName = 'WithAuth'
  return Component
}

export default withAuth
