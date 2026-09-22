import withAuth, { UserSessionProps } from '@/components/hoc/withAuth'
import withStudyDetails, { StudyProps } from '@/components/hoc/withStudyDetails'
import StudyDataEntryInfographyPage from '@/components/pages/StudyDataEntryInfographyPage'
import { isOrganizationVersionCR } from '@/db/organization'
import { canDeleteStudy, canDuplicateStudy, getEnvironmentsForDuplication } from '@/services/permissions/study'
import { NEWGetAccountRoleOnStudyWithId } from '@/services/serverFunctions/study'
import NotFound from '@abc-transitionbascarbone/components/src/pages/NotFound'

const DataEntry = async ({ study, user, studyId }: StudyProps & UserSessionProps) => {
  const userRole = await NEWGetAccountRoleOnStudyWithId(user, studyId)
  if (!userRole.success || !userRole.data) {
    return <NotFound />
  }
  const [canDelete, canDuplicate, duplicableEnvironments, userOrgIsCR] = await Promise.all([
    canDeleteStudy(studyId),
    canDuplicateStudy(studyId),
    getEnvironmentsForDuplication(studyId),
    isOrganizationVersionCR(user.organizationVersionId),
  ])

  if (!userRole) {
    return <NotFound />
  }
  return (
    <StudyDataEntryInfographyPage
      study={study}
      userRole={userRole.data}
      user={user}
      canDeleteStudy={canDelete}
      canDuplicateStudy={canDuplicate}
      duplicableEnvironments={duplicableEnvironments}
      organizationVersionId={userOrgIsCR ? study.organizationVersionId : null}
    />
  )
}

export default withAuth(withStudyDetails(DataEntry))
