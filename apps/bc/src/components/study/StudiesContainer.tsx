import { getOrganizationVersionForRightsCheck } from '@/db/organization'
import {
  StudyCardItem,
  getAllowedStudiesByAccount,
  getAllowedStudiesByUserAndOrganization,
  getExternalAllowedStudiesByUser,
  getStudiesForCards,
  getStudiesValidatedEmissionsSources,
} from '@/db/study'
import { canCreateStudyOnlyAsAdministrator, isTilt } from '@/services/permissions/environment'
import { isTiltSimplifiedFeatureActive } from '@/services/permissions/environmentFeature'
import { canCreateAStudy } from '@/services/permissions/study'
import { hasActiveLicence } from '@/utils/organization'
import { isCourseEnvironment } from '@abc-transitionbascarbone/common/utils/environments'
import { UserSession } from 'next-auth'
import CannotCreateStudy from './CannotCreateStudy'
import CreateFirstStudy from './CreateFirstStudy'
import NoStudies from './NoStudies'
import StudiesList from './StudiesList'

interface Props {
  user: UserSession
  organizationVersionId?: string
  isCR?: boolean
  simplified?: boolean
}

const StudiesContainer = async ({ user, organizationVersionId, isCR, simplified = false }: Props) => {
  const allowedStudies = organizationVersionId
    ? await getAllowedStudiesByUserAndOrganization(user, organizationVersionId, simplified)
    : isCR
      ? await getExternalAllowedStudiesByUser(user)
      : await getAllowedStudiesByAccount(user)

  const allowedStudyIds = allowedStudies.map((study) => study.id)

  const mainStudyOrganizationVersionId = organizationVersionId ?? user.organizationVersionId

  const [organizationVersion, studiesForCards, studiesValidatedSources] = await Promise.all([
    getOrganizationVersionForRightsCheck(mainStudyOrganizationVersionId),
    getStudiesForCards(allowedStudyIds),
    getStudiesValidatedEmissionsSources(allowedStudyIds),
  ])

  const studies = allowedStudyIds
    .map((studyId) => {
      const card = studiesForCards[studyId]
      if (!card) {
        return null
      }
      return { ...card, validatedSources: studiesValidatedSources[studyId] }
    })
    .filter((c): c is StudyCardItem => c !== null)

  const isOrgaHomePage = !organizationVersionId && !isCR
  const [orgaStudies, otherStudies] = isOrgaHomePage
    ? studies.reduce(
        (res, study) => {
          res[study.organizationVersion.id === user.organizationVersionId ? 0 : 1].push(study)
          return res
        },
        [[] as StudyCardItem[], [] as StudyCardItem[]],
      )
    : [studies, [] as StudyCardItem[]]

  const mainStudies = isOrgaHomePage ? orgaStudies : studies
  const collaborationStudies = isOrgaHomePage ? otherStudies : []
  const advancedStudies = mainStudies.filter((study) => !study.simplified)
  const simplifiedStudies = mainStudies.filter((study) => study.simplified)

  const creationUrl = organizationVersionId ? `/organisations/${organizationVersionId}/etudes/creer` : '/etudes/creer'
  const creationUrlSimplified = `${creationUrl}?simplified=true`

  const activeLicence = !!(organizationVersion && hasActiveLicence(organizationVersion))

  let displaySimplifiedStudies = false
  let hasStudies = studies.length > 0
  if (!isTilt(user.environment)) {
    displaySimplifiedStudies = true
  } else {
    displaySimplifiedStudies = await isTiltSimplifiedFeatureActive(user.environment)
    if (!displaySimplifiedStudies) {
      hasStudies = advancedStudies.length > 0 || collaborationStudies.length > 0
    }
  }

  if (hasStudies) {
    return (
      <StudiesList
        user={user}
        advancedStudies={advancedStudies}
        simplifiedStudies={simplifiedStudies}
        collaborationStudies={collaborationStudies}
        displaySimplifiedStudies={displaySimplifiedStudies}
        activeLicence={activeLicence}
        creationUrl={creationUrl}
        creationUrlSimplified={creationUrlSimplified}
        organizationVersionId={organizationVersionId}
        isCR={isCR}
      />
    )
  }

  if ((await canCreateAStudy(user, simplified)) && !isCR) {
    return (
      <CreateFirstStudy
        simplified={simplified}
        creationUrl={simplified ? creationUrlSimplified : creationUrl}
        showBetaBanner={isTilt(user.environment) && displaySimplifiedStudies && simplified}
      />
    )
  }

  if (isCourseEnvironment(user.environment) || isCR) {
    return null
  }

  if (!canCreateStudyOnlyAsAdministrator(user.environment) && !simplified) {
    return <CannotCreateStudy environment={user.environment} />
  }

  return <NoStudies />
}

export default StudiesContainer
