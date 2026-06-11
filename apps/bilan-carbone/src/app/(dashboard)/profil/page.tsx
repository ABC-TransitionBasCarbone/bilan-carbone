'use server'

import withAuth from '@/components/hoc/withAuth'
import ProfilePage from '@/components/pages/Profile'
import Block from '@abc-transitionbascarbone/components/src/base/Block'
import { useTranslations } from 'next-intl'
import pakage from '../../../../package.json'

const Profile = () => {
  const t = useTranslations('profile')
  return (
    <Block title={t('title')} as="h1">
      <ProfilePage version={pakage.version} />
    </Block>
  )
}

export default withAuth(Profile)
