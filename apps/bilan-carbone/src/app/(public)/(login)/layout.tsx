import PublicPage from '@/components/pages/Public'
import styles from '@/components/pages/Public.module.css'
import DynamicTheme from '@/environments/core/providers/DynamicTheme'
import { customRich } from '@/i18n/customRich'
import { Environment } from '@abc-transitionbascarbone/db-common/enums'
import { getTranslations } from 'next-intl/server'
import { ReactNode } from 'react'

interface Props {
  children: ReactNode
}

const PublicLayout = async ({ children }: Props) => {
  const t = await getTranslations('login')
  const question = customRich(t, 'question', {}, undefined, { faq: styles.link, support: styles.link })

  return (
    <DynamicTheme environment={Environment.BC}>
      <main className="h100">
        <PublicPage question={question}>{children}</PublicPage>
      </main>
    </DynamicTheme>
  )
}

export default PublicLayout
