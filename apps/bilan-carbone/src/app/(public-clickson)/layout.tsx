import styles from '@/components/pages/Public.module.css'
import PublicClicksonPage from '@/components/pages/PublicClickson'
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
  title: 'Bienvenue sur Clickson PEBC',
  description: 'Mesurons les émissions de gaz à effet de serre de votre établissement!',
}

const PublicLayout = async ({ children }: Props) => {
  const t = await getTranslations('login')
  const question = customRich(t, 'question', {}, Environment.CLICKSON, { faq: styles.link, support: styles.link })
  return (
    <DynamicTheme environment={Environment.CLICKSON}>
      <main className="h100">
        <PublicClicksonPage question={question}>{children}</PublicClicksonPage>
      </main>
    </DynamicTheme>
  )
}

export default PublicLayout
