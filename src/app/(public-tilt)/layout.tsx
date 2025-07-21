import PublicTiltPage from '@/components/pages/PublicTilt'
import DynamicTheme from '@/environments/core/providers/DynamicTheme'
import { Environment } from '@prisma/client'
import { Metadata } from 'next'
import { ReactNode } from 'react'

interface Props {
  children: ReactNode
}

export const metadata: Metadata = {
  title: 'Bilan Carbone + pour les associations',
  description: 'Découvrez le logiciel Bilan Carbone + pour les associations',
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
