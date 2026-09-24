import PublicFormation from '@/components/pages/PublicFormation'
import DynamicTheme from '@/environments/core/providers/DynamicTheme'
import { Environment } from '@abc-transitionbascarbone/db-common/enums'
import { customRich } from '@abc-transitionbascarbone/utils/customRich'
import { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { ReactNode } from 'react'

interface Props {
  children: ReactNode
}

export const metadata: Metadata = {
  title: 'Bilan Carbone + pour les associations',
  description: 'Découvrez le logiciel Bilan Carbone + pour les associations',
}

const PublicLayout = async ({ children }: Props) => {
  const t = await getTranslations()
  const question = customRich(t, 'login.question', {}, Environment.FORMATION_BC)
  return (
    <DynamicTheme environment={Environment.FORMATION_BC}>
      <main className="h100">
        <PublicFormation question={question}>{children}</PublicFormation>
      </main>
    </DynamicTheme>
  )
}

export default PublicLayout
