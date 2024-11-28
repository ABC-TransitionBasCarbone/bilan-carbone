import { OrganizationWithSites } from '@/db/user'
import { Role } from '@prisma/client'
import { User } from 'next-auth'
import { useTranslations } from 'next-intl'
import Block from '../base/Block'

interface Props {
  user: User
  organization: OrganizationWithSites
}

const OrganizationInfo = ({ organization, user }: Props) => {
  const t = useTranslations('organization')
  return (
    <Block
      as="h1"
      title={`${t('myOrganization')} ${organization.name}`}
      link={user.role === Role.ADMIN ? `/organisations/${organization.id}/modifier` : ''}
      linkLabel={t('modify')}
      data-testid="organization-name"
      linkDataTestId="edit-organization-button"
    />
  )
}

export default OrganizationInfo
