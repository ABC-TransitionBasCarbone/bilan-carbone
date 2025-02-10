'use server'

import Block from '@/components/base/Block'
import withAuth from '@/components/hoc/withAuth'
import SettingsPage from '@/components/pages/Settings'
import { useTranslations } from 'next-intl'

const Settings = () => {
  const t = useTranslations('settings')
  return (
    <Block title={t('title')} as="h1">
      <SettingsPage />
    </Block>
  )
}

export default withAuth(Settings)
