import PublicFormation from '@/components/pages/PublicFormation'
import DynamicTheme from '@/environments/core/providers/DynamicTheme'
import { Environment } from '@abc-transitionbascarbone/common/db/enums'
import { customRich } from '@abc-transitionbascarbone/common/utils/customRich'
import { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { ReactNode } from 'react'

interface Props {
  children: ReactNode
}

export const metadata: Metadata = {
  title: 'Bilan Carbone + pour la formation',
  description: 'Découvrez le logiciel Bilan Carbone + pour la formation',
}

const PublicLayout = async ({ children }: Props) => {
  const t = await getTranslations()
  const question = customRich(t, 'login.question', {}, Environment.COURSE_BC)
  return (
    <DynamicTheme environment={Environment.COURSE_BC}>
      <main className="h100">
        <PublicFormation question={question} environment={Environment.COURSE_BC}>
          {children}
        </PublicFormation>
      </main>
    </DynamicTheme>
  )
}

export default PublicLayout
