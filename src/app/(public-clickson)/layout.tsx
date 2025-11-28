import PublicClicksonPage from '@/components/pages/PublicClickson'
import DynamicTheme from '@/environments/core/providers/DynamicTheme'
import { Environment } from '@prisma/client'
import { Metadata } from 'next'
import { ReactNode } from 'react'

interface Props {
  children: ReactNode
}

export const metadata: Metadata = {
  title: 'Bienvenue sur Clickson PEBC',
  description: 'Mesurons les émissions de gaz à effet de serre de votre établissement!',
}

const PublicLayout = ({ children }: Props) => {
  return (
    <DynamicTheme environment={Environment.CLICKSON}>
      <main className="h100">
        <PublicClicksonPage>{children}</PublicClicksonPage>
      </main>
    </DynamicTheme>
  )
}

export default PublicLayout
