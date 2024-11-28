import { OrganizationWithSites } from '@/db/user'
import { Role } from '@prisma/client'
import { User } from 'next-auth'
import { useTranslations } from 'next-intl'
import Block from '../base/Block'
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
      actions={[
        {
          actionType: 'link',
          href: user.role === Role.ADMIN ? `/organisations/${organization.id}/modifier` : '',
          'data-testid': 'edit-organization-button',
          children: t('modify'),
        },
      ]}
    >
      <p data-testid="organization-name">
        <span className={styles.info}>{t('name')}</span> {organization.name}
      </p>
    </Block>
  )
}

export default OrganizationInfo
