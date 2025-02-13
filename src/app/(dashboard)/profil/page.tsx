'use server'

import Block from '@/components/base/Block'
import withAuth from '@/components/hoc/withAuth'
import ProfilePage from '@/components/pages/Profile'
import { useTranslations } from 'next-intl'
import { version } from '../../../../package.json'

const Profile = () => {
  const t = useTranslations('profile')
  return (
    <Block title={t('title')} as="h1">
      <ProfilePage version={version} />
    </Block>
  )
}

export default withAuth(Profile)
