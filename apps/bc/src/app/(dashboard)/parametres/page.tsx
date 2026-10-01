'use server'

import withAuth, { UserSessionProps } from '@/components/hoc/withAuth'
import SettingsPage from '@/components/pages/Settings'
import { hasAccessToSettings } from '@/services/permissions/environmentAdvanced'
import Block from '@abc-transitionbascarbone/application/components/base/Block'
import NotFound from '@abc-transitionbascarbone/application/components/pages/NotFound'
import { useTranslations } from 'next-intl'

const Settings = ({ user }: UserSessionProps) => {
  const t = useTranslations('settings')

  if (!hasAccessToSettings(user.environment, user.level)) {
    return <NotFound />
  }
  return (
    <Block title={t('title')} as="h1">
      <SettingsPage />
    </Block>
  )
}

export default withAuth(Settings)
