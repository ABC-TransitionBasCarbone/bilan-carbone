import styles from '@/components/pages/Public.module.css'
import PublicCutPage from '@/components/pages/PublicCut'
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
  title: "Count le premier calculateur d'impact écologique dédié aux salles de cinéma",
  description: "Count le premier calculateur d'impact écologique dédié aux salles de cinéma",
}

const PublicLayout = async ({ children }: Props) => {
  const t = await getTranslations('login')
  const question = customRich(t, 'question', {}, Environment.CUT, { faq: styles.link, support: styles.link })
  return (
    <DynamicTheme environment={Environment.CUT}>
      <main className="h100">
        <PublicCutPage question={question}>{children}</PublicCutPage>
      </main>
    </DynamicTheme>
  )
}

export default PublicLayout
