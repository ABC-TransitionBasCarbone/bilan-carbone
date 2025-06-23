import PublicPage from '@/components/pages/Public'
import DynamicTheme from '@/environments/core/providers/DynamicTheme'
import { Environment } from '@prisma/client'
import { ReactNode } from 'react'

interface Props {
  children: ReactNode
}

const PublicLayout = ({ children }: Props) => {
  return (
    <DynamicTheme environment={Environment.BC}>
      <main className="h100">
        <PublicPage>{children}</PublicPage>
      </main>
    </DynamicTheme>
  )
}

export default PublicLayout
