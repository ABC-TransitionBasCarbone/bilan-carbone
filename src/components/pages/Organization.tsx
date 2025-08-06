'use server'

import { OrganizationWithSites } from '@/db/account'
import { canDeleteOrganizationVersion, canUpdateOrganizationVersion } from '@/services/permissions/organization'
import { Environment } from '@prisma/client'
import { UserSession } from 'next-auth'
import { getTranslations } from 'next-intl/server'
import Breadcrumbs from '../breadcrumbs/Breadcrumbs'
import OrganizationInfo from '../organization/Info'
import StudiesContainer from '../study/StudiesContainer'

interface Props {
  organizationVersion: OrganizationWithSites
  user: UserSession
}

const OrganizationPage = async ({ organizationVersion, user }: Props) => {
  const environment = user.environment
  const tNav = await getTranslations('nav')
  const [canUpdate, canDelete] = await Promise.all([
    canUpdateOrganizationVersion(user, organizationVersion.id),
    canDeleteOrganizationVersion(organizationVersion.id),
  ])

  return (
    <>
      <Breadcrumbs current={organizationVersion.organization.name} links={[{ label: tNav('home'), link: '/' }]} />
      {environment !== Environment.CUT && (
        <OrganizationInfo organizationVersion={organizationVersion} canUpdate={canUpdate} canDelete={canDelete} />
      )}
      <StudiesContainer user={user} organizationVersionId={organizationVersion.id} />
    </>
  )
}

export default OrganizationPage
