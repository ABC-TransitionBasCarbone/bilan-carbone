'use server'

import Block from '@/components/base/Block'
import withAuth from '@/components/hoc/withAuth'
import ProfilePage from '@/components/pages/Profile'
import { useTranslations } from 'next-intl'
import pkg from '../../../../package.json'

const Profile = () => {
  const t = useTranslations('profile')
  return (
    <Block title={t('title')} as="h1">
      <ProfilePage version={pkg.version} />
    </Block>
  )
}

export default withAuth(Profile)
