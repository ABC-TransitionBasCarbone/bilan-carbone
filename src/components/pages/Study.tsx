'use server'

import { isOrganizationVersionCR, OrganizationVersionWithOrganization } from '@/db/organization'
import { FullStudy } from '@/db/study'
import { getUserApplicationSettings } from '@/db/user'
import { canDeleteStudy } from '@/services/permissions/study'
import { canEditOrganizationVersion } from '@/utils/organization'
import { UserSession } from 'next-auth'
import { getTranslations } from 'next-intl/server'
import Breadcrumbs from '../breadcrumbs/Breadcrumbs'
import StudyDetails from '../study/StudyDetails'

interface Props {
  study: FullStudy
  user: UserSession
}

const StudyPage = async ({ study, user }: Props) => {
  const tNav = await getTranslations('nav')
  const [canDelete, canEditOrga, settings, userOrgIsCR] = await Promise.all([
    canDeleteStudy(study.id),
    canEditOrganizationVersion(user, study.organizationVersion as OrganizationVersionWithOrganization),
    getUserApplicationSettings(user.accountId),
    isOrganizationVersionCR(user.organizationVersionId),
  ])

  return (
    <>
      <Breadcrumbs
        current={study.name}
        links={[
          { label: tNav('home'), link: '/' },
          study.organizationVersion.isCR
            ? {
                label: study.organizationVersion.organization.name,
                link: `/organisations/${study.organizationVersion.id}`,
              }
            : undefined,
        ].filter((link) => link !== undefined)}
      />
      <StudyDetails
        study={study}
        canDeleteStudy={canDelete}
        canDuplicateStudy={canEditOrga}
        validatedOnly={settings.validatedEmissionSourcesOnly}
        organizationVersionId={userOrgIsCR ? study.organizationVersionId : null}
      />
    </>
  )
}

export default StudyPage
