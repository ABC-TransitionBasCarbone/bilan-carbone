import styles from '@/components/pages/Public.module.css'
import PublicTiltPage from '@/components/pages/PublicTilt'
import DynamicTheme from '@/environments/core/providers/DynamicTheme'
import { customRich } from '@/i18n/customRich'
import { Environment } from '@repo/db-common/enums'
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
  const t = await getTranslations('login')
  const question = customRich(t, 'question', {}, Environment.TILT, { faq: styles.link, support: styles.link })
  return (
    <DynamicTheme environment={Environment.TILT}>
      <main className="h100">
        <PublicTiltPage question={question}>{children}</PublicTiltPage>
      </main>
    </DynamicTheme>
  )
}

export default PublicLayout
