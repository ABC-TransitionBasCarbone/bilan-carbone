'use server'

import { OrganizationVersion } from '@prisma/client'
import { UserSession } from 'next-auth'
import { getTranslations } from 'next-intl/server'
import Breadcrumbs from '../breadcrumbs/Breadcrumbs'
import StudiesContainer from '../study/StudiesContainer'

interface Props {
  organizationVersion: { id: OrganizationVersion['id']; organization: { name: string } }
  user: UserSession
}

const SimplifiedStudiesContainer = async ({ organizationVersion, user }: Props) => {
  const tNav = await getTranslations('nav')

  return (
    <>
      <Breadcrumbs current={organizationVersion.organization.name} links={[{ label: tNav('home'), link: '/' }]} />
      <StudiesContainer user={user} organizationVersionId={organizationVersion.id} simplified />
    </>
  )
}

export default SimplifiedStudiesContainer
