import PublicPage from '@/components/pages/Public'
import DynamicTheme from '@/environments/core/providers/DynamicTheme'
import { Environment } from '@abc-transitionbascarbone/common/db/enums'
import { customRich } from '@abc-transitionbascarbone/common/utils/customRich'
import { getTranslations } from 'next-intl/server'
import { ReactNode } from 'react'

interface Props {
  children: ReactNode
}

const PublicLayout = async ({ children }: Props) => {
  const t = await getTranslations()
  const question = customRich(t, 'login.question', {}, Environment.BC)

  return (
    <DynamicTheme environment={Environment.BC}>
      <main className="h100">
        <PublicPage question={question}>{children}</PublicPage>
      </main>
    </DynamicTheme>
  )
}

export default PublicLayout
