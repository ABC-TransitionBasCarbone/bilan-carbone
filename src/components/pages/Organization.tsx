'use server'

import { OrganizationWithSites } from '@/db/account'
import { canDeleteOrganization, canUpdateOrganization } from '@/services/permissions/organization'
import { UserSession } from 'next-auth'
import { getTranslations } from 'next-intl/server'
import Breadcrumbs from '../breadcrumbs/Breadcrumbs'
import OrganizationInfo from '../organization/Info'
import StudiesContainer from '../study/StudiesContainer'

interface Props {
  organization: OrganizationWithSites
  user: UserSession
}

const OrganizationPage = async ({ organization, user }: Props) => {
  const tNav = await getTranslations('nav')
  const [canUpdate, canDelete] = await Promise.all([
    canUpdateOrganization(user, organization.id),
    canDeleteOrganization(organization.id),
  ])

  return (
    <>
      <Breadcrumbs current={organization.name} links={[{ label: tNav('home'), link: '/' }]} />
      <OrganizationInfo organization={organization} canUpdate={canUpdate} canDelete={canDelete} />
      <StudiesContainer user={user} organizationId={organization.id} />
    </>
  )
}

export default OrganizationPage
