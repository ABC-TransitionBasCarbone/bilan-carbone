import { getOrganizationVersionWithSitesById } from '@/db/organization'
import type { FullStudy } from '@/db/study'
import { getUserApplicationSettings } from '@/db/user'
import DynamicStudyRights from '@/environments/core/study/DynamicStudyRights'
import { getEmissionFactorImportVersions } from '@/services/serverFunctions/emissionFactor'
import { defaultCAUnit } from '@/utils/number'
import { getAccountRoleOnStudy, hasEditionRights } from '@/utils/study'
import { UserSession } from 'next-auth'
import { getTranslations } from 'next-intl/server'
import Breadcrumbs from '../breadcrumbs/Breadcrumbs'
import NotFound from './NotFound'

interface Props {
  study: FullStudy
  user: UserSession
}

const StudyRightsPage = async ({ study, user }: Props) => {
  const tNav = await getTranslations('nav')

  const userRoleOnStudy = getAccountRoleOnStudy(user, study)

  const editionDisabled = !hasEditionRights(userRoleOnStudy)

  const caUnit = (await getUserApplicationSettings(user.accountId))?.caUnit || defaultCAUnit

  const organizationVersion = await getOrganizationVersionWithSitesById(study.organizationVersionId)

  const emissionFactorImportVersionRes = await getEmissionFactorImportVersions(true)
  if (!emissionFactorImportVersionRes.success) {
    console.error('Failed to fetch emission factor import versions')
    return <NotFound />
  }

  if (!userRoleOnStudy) {
    return <NotFound />
  }

  return (
    <>
      <Breadcrumbs
        current={tNav('studyRights')}
        links={[
          { label: tNav('home'), link: '/' },
          study.organizationVersion.isCR
            ? {
                label: study.organizationVersion.organization.name,
                link: `/organisations/${study.organizationVersion.id}`,
              }
            : undefined,
          { label: study.name, link: `/etudes/${study.id}` },
        ].filter((link) => link !== undefined)}
      />

      <DynamicStudyRights
        user={user}
        study={study}
        editionDisabled={editionDisabled}
        userRoleOnStudy={userRoleOnStudy}
        emissionFactorSources={emissionFactorImportVersionRes.data}
        caUnit={caUnit}
        organizationVersion={organizationVersion}
      />
    </>
  )
}

export default StudyRightsPage
