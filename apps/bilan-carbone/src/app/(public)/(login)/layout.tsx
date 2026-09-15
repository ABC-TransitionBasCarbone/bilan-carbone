import PublicPage from '@/components/pages/Public'
import DynamicTheme from '@/environments/core/providers/DynamicTheme'
import { Environment } from '@abc-transitionbascarbone/db-common/enums'
import { Locale } from '@abc-transitionbascarbone/i18n/config'
import { customRich } from '@abc-transitionbascarbone/utils/customRich'
import { getLocale, getTranslations } from 'next-intl/server'
import { ReactNode } from 'react'

interface Props {
  children: ReactNode
}

const PublicLayout = async ({ children }: Props) => {
  const t = await getTranslations('login')
  const locale = await getLocale()
  const question = customRich(t, 'question', {}, Environment.BC, locale === Locale.EN ? Locale.EN : Locale.FR)

  return (
    <DynamicTheme environment={Environment.BC}>
      <main className="h100">
        <PublicPage question={question}>{children}</PublicPage>
      </main>
    </DynamicTheme>
  )
}

export default PublicLayout
