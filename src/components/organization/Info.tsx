import { OrganizationWithSites } from '@/db/userAuth'
import { isAdmin } from '@/services/permissions/user'
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
      actions={
        isAdmin(user.role)
          ? [
              {
                actionType: 'link',
                href: `/organisations/${organization.id}/modifier`,
                'data-testid': 'edit-organization-button',
                children: t('modify'),
              },
            ]
          : undefined
      }
    >
      <p data-testid="organization-name">
        <span className={styles.info}>{t('name')}</span> {organization.name}
      </p>
    </Block>
  )
}

export default OrganizationInfo
