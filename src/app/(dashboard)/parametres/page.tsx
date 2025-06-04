'use server'

import Block from '@/components/base/Block'
import withAuth, { UserSessionProps } from '@/components/hoc/withAuth'
import NotFound from '@/components/pages/NotFound'
import SettingsPage from '@/components/pages/Settings'
import { hasAccessToSettings } from '@/services/permissions/environment'
import { useTranslations } from 'next-intl'

const Settings = ({ user }: UserSessionProps) => {
  const t = useTranslations('settings')

  if (!hasAccessToSettings(user.environment)) {
    return <NotFound />
  }
  return (
    <Block title={t('title')} as="h1">
      <SettingsPage />
    </Block>
  )
}

export default withAuth(Settings)
