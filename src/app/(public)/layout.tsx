import React, { ReactNode } from 'react'
import PublicPage from '@/components/pages/Public'

interface Props {
  children: ReactNode
}

const PublicLayout = ({ children }: Props) => {
  return (
    <main>
      <PublicPage>{children}</PublicPage>
    </main>
  )
}

export default PublicLayout
