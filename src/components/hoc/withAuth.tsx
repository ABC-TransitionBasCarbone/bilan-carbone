import NotFound from '@/components/pages/NotFound'
import { auth } from '@/services/auth'
import { UserSession } from 'next-auth'
import { redirect } from 'next/navigation'
import React from 'react'

export type UserSessionProps = {
  user: UserSession
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const withAuth = (WrappedComponent: React.ComponentType<any & UserSessionProps>) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const Component = async (props: any) => {
    const session = await auth()
    if (!session || !session.user) {
      return <NotFound />
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
