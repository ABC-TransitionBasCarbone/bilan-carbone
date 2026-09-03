import withAuth, { UserSessionProps } from '@/components/hoc/withAuth'
import withStudyDetails, { StudyProps } from '@/components/hoc/withStudyDetails'
import StudyDataEntryInfographyPage from '@/components/pages/StudyDataEntryInfographyPage'
import { canDeleteStudy, canDuplicateStudy, getEnvironmentsForDuplication } from '@/services/permissions/study'
import { getStudySitesList } from '@/services/serverFunctions/study'
import NotFound from '@abc-transitionbascarbone/components/src/pages/NotFound'

const DataEntry = async ({
  studyId,
  userStudyRole,
  user,
  studyOrganizationVersion,
  studyName,
  study: fullStudy, // TODO: remove at the end of refacto
}: StudyProps & UserSessionProps) => {
  const [canDelete, canDuplicate, duplicableEnvironments, studySites] = await Promise.all([
    canDeleteStudy(studyId),
    canDuplicateStudy(studyId),
    getEnvironmentsForDuplication(studyId),
    getStudySitesList(studyId),
  ])

  if (!userStudyRole || !studySites.success || !studySites.data) {
    return <NotFound />
  }
  return (
    <StudyDataEntryInfographyPage
      userRole={userStudyRole}
      user={user}
      canDeleteStudy={canDelete}
      canDuplicateStudy={canDuplicate}
      duplicableEnvironments={duplicableEnvironments}
      studyOrganizationVersion={studyOrganizationVersion}
      studySites={studySites.data}
      studyName={studyName}
      studyId={studyId}
      fullStudy={fullStudy}
    />
  )
}

export default withAuth(withStudyDetails(DataEntry))
