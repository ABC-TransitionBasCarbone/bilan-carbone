import PublicTiltPage from '@/components/pages/PublicTilt'
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
    <DynamicTheme environment={Environment.TILT}>
      <main className="h100">
        <PublicTiltPage>{children}</PublicTiltPage>
      </main>
    </DynamicTheme>
  )
}

export default PublicLayout
