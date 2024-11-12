import React from 'react'
import Block from '../base/Block'
import { useTranslations } from 'next-intl'
import OrganizationInfo from '../organization/Info'
import { OrganizationWithSites } from '@/db/user'
import { User } from 'next-auth'
import Breadcrumbs from '../breadcrumbs/Breadcrumbs'

interface Props {
  organizations: OrganizationWithSites[]
  user: User
}

const OrganizationPage = ({ organizations, user }: Props) => {
  const tNav = useTranslations('nav')
  const t = useTranslations('organization')
  return (
    <>
      <Breadcrumbs current={tNav('organization')} links={[{ label: tNav('home'), link: '/' }]} />
      <Block title={t('title')} as="h1" />
      <OrganizationInfo organization={organizations[0]} user={user} />
    </>
  )
}

export default OrganizationPage
