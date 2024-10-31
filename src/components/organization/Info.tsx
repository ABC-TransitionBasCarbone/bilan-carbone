import { OrganizationWithSites } from '@/db/user'
import React from 'react'
import Block from '../base/Block'
import { useTranslations } from 'next-intl'
import { User } from 'next-auth'
import { Role } from '@prisma/client'
import Sites from './Sites'
import styles from './Info.module.css'

interface Props {
  user: User
  organization: OrganizationWithSites
}

const OrganizationInfo = ({ organization, user }: Props) => {
  const t = useTranslations('organization')
  return (
    <Block
      title={t('my-organization')}
      link={user.role === Role.ADMIN ? `/organisations/${organization.id}/modifier` : ''}
      linkLabel={t('modify')}
    >
      <p>
        <span className={styles.info}>{t('name')}</span> {organization.name}
      </p>
      <Sites sites={organization.sites} />
    </Block>
  )
}

export default OrganizationInfo
