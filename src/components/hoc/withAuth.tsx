import NotFound from '@/components/pages/NotFound'
import { auth } from '@/services/auth'
import { User } from 'next-auth'
import React from 'react'

export type UserProps = {
  user: User
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const withAuth = (WrappedComponent: React.ComponentType<any & UserProps>) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const Component = async (props: any) => {
    const session = await auth()
    if (!session || !session.user) {
      return <NotFound />
    }
    return <WrappedComponent {...props} user={session.user} />
  }
  Component.displayName = 'WithAuth'
  return Component
}

export default withAuth
