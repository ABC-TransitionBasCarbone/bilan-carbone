import PublicCutPage from '@/components/pages/PublicCut'
import DynamicTheme from '@/environments/core/providers/DynamicTheme'
import { Environment } from '@prisma/client'
import { Metadata } from 'next'
import { ReactNode } from 'react'

interface Props {
  children: ReactNode
}

export const metadata: Metadata = {
  title: "Count le premier calculateur d'impact écologique dédié aux salles de cinéma",
  description: "Count le premier calculateur d'impact écologique dédié aux salles de cinéma",
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
