import React from 'react'
import Block from '../base/Block'
import { useTranslations } from 'next-intl'
import OrganizationInfo from '../organization/Info'
import { OrganizationWithSites } from '@/db/user'
import { User } from 'next-auth'

interface Props {
  organizations: OrganizationWithSites[]
  user: User
}

const OrganizationPage = ({ organizations, user }: Props) => {
  const t = useTranslations('organization')
  return (
    <>
      <Block title={t('title')} as="h1" />
      <OrganizationInfo organization={organizations[0]} user={user} />
    </>
  )
}

export default OrganizationPage
