import PublicCutPage from '@/components/pages/PublicCut'
import DynamicTheme from '@/environments/core/providers/DynamicTheme'
import { Environment } from '@prisma/client'
import { ReactNode } from 'react'

interface Props {
  children: ReactNode
}

const PublicLayout = ({ children }: Props) => {
  return (
    <DynamicTheme environment={Environment.CUT}>
      <main className="h100">
        <PublicCutPage>{children}</PublicCutPage>
      </main>
    </DynamicTheme>
  )
}

export default PublicLayout
