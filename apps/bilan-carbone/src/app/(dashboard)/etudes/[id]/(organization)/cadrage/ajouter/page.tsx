import withAuth, { UserSessionProps } from '@/components/hoc/withAuth'
import withStudyDetails, { StudyProps } from '@/components/hoc/withStudyDetails'
import NewStudyRightPage from '@/components/pages/NewStudyRight'
import { NEWGetAccountRoleOnStudyWithId } from '@/services/serverFunctions/study'
import { hasEditionRights } from '@/utils/study'
import NotFound from '@abc-transitionbascarbone/components/src/pages/NotFound'
import { redirect } from 'next/navigation'

const NewStudyRight = async ({ study, user, studyId }: StudyProps & UserSessionProps) => {
  const userRoleOnStudy = await NEWGetAccountRoleOnStudyWithId(user, studyId)
  if (!userRoleOnStudy.success) {
    return <NotFound />
  }

  if (!hasEditionRights(userRoleOnStudy.data)) {
    redirect(`/etudes/${studyId}/cadrage`)
  }

  return <NewStudyRightPage study={study} user={user} />
}

export default withAuth(withStudyDetails(NewStudyRight))
