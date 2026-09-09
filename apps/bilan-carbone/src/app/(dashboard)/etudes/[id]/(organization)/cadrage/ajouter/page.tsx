import withAuth, { UserSessionProps } from '@/components/hoc/withAuth'
import withStudyDetails, { StudyProps } from '@/components/hoc/withStudyDetails'
import NewStudyRightPage from '@/components/pages/NewStudyRight'
import { hasEditionRights, NEWGetAccountRoleOnStudy } from '@/utils/study'
import { redirect } from 'next/navigation'

const NewStudyRight = async ({ study, user, studyId }: StudyProps & UserSessionProps) => {
  const userRoleOnStudy = await NEWGetAccountRoleOnStudy(user, studyId)

  if (!hasEditionRights(userRoleOnStudy)) {
    redirect(`/etudes/${studyId}/cadrage`)
  }

  return <NewStudyRightPage study={study} user={user} />
}

export default withAuth(withStudyDetails(NewStudyRight))
