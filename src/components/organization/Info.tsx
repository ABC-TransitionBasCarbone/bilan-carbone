import { OrganizationWithSites } from '@/db/user'
import Block from '../base/Block'
import { useTranslations } from 'next-intl'
import { User } from 'next-auth'
import { Role } from '@prisma/client'
import styles from './Info.module.css'

interface Props {
  user: User
  organization: OrganizationWithSites
}

const OrganizationInfo = ({ organization, user }: Props) => {
  const t = useTranslations('organization')
  return (
    <Block
      as="h1"
      title={t('myOrganization')}
      link={user.role === Role.ADMIN ? `/organisations/${organization.id}/modifier` : ''}
      linkLabel={t('modify')}
    >
      <p data-testid="organization-name">
        <span className={styles.info}>{t('name')}</span> {organization.name}
      </p>
    </Block>
  )
}

export default OrganizationInfo
