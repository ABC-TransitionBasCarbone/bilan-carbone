import React, { ReactNode } from 'react'
import PublicPage from '@/components/pages/public'

const PublicLayout = ({ children }: { children: ReactNode }) => {
  return (
    <main>
      <PublicPage>{children}</PublicPage>
    </main>
  )
}

export default PublicLayout
