import { getOrganizationVersionWithSitesById } from '@/db/organization'
import type { MinimalStudyForRights } from '@/db/study'
import { getUserApplicationSettings } from '@/db/user'
import DynamicStudyRights from '@/environments/core/study/DynamicStudyRights'
import { getEmissionFactorImportVersions } from '@/services/serverFunctions/emissionFactor'
import { getStudySitesList, NEWGetAccountRoleOnStudy } from '@/services/serverFunctions/study'
import { defaultCAUnit } from '@/utils/number'
import { hasEditionRights } from '@/utils/study'
import NotFound from '@abc-transitionbascarbone/components/src/pages/NotFound'
import { UserSession } from 'next-auth'
import { getTranslations } from 'next-intl/server'
import Breadcrumbs from '../breadcrumbs/Breadcrumbs'

interface Props {
  user: UserSession
  minimalStudy: MinimalStudyForRights
}

const StudyRightsPage = async ({ user, minimalStudy }: Props) => {
  const tNav = await getTranslations('nav')

  const userRoleOnStudy = await NEWGetAccountRoleOnStudy(user, minimalStudy.id)
  if (!userRoleOnStudy.success || !userRoleOnStudy.data) {
    return <NotFound />
  }

  const editionDisabled = !hasEditionRights(userRoleOnStudy.data)

  const caUnit = (await getUserApplicationSettings(user.accountId))?.caUnit || defaultCAUnit

  const organizationVersion = await getOrganizationVersionWithSitesById(minimalStudy.organizationVersion.id)

  const emissionFactorImportVersionRes = await getEmissionFactorImportVersions(true)
  if (!emissionFactorImportVersionRes.success) {
    console.error('Failed to fetch emission factor import versions')
    return <NotFound />
  }

  if (!userRoleOnStudy) {
    return <NotFound />
  }

  const studySites = await getStudySitesList(minimalStudy.id)
  if (!studySites.success || !studySites.data) {
    return <NotFound />
  }

  return (
    <>
      <Breadcrumbs
        current={tNav('studyRights')}
        links={[
          { label: tNav('home'), link: '/' },
          minimalStudy.organizationVersion.parentId
            ? {
                label: minimalStudy.organizationVersion.organization.name,
                link: `/organisations/${minimalStudy.organizationVersion.id}`,
              }
            : undefined,
          { label: minimalStudy.name, link: `/etudes/${minimalStudy.id}` },
        ].filter((link) => link !== undefined)}
      />

      <DynamicStudyRights
        user={user}
        study={minimalStudy}
        editionDisabled={editionDisabled}
        userRoleOnStudy={userRoleOnStudy.data}
        emissionFactorSources={emissionFactorImportVersionRes.data}
        caUnit={caUnit}
        organizationVersion={organizationVersion}
        studySites={studySites.data}
      />
    </>
  )
}

export default StudyRightsPage
