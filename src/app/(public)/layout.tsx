import React, { ReactNode } from 'react'
import PublicPage from '@/components/pages/public'

const PublicLayout = ({ children }: { children: ReactNode }) => {
  return <PublicPage>{children}</PublicPage>
}

export default PublicLayout
