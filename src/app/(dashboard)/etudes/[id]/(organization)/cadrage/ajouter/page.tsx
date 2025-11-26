import withAuth, { UserSessionProps } from '@/components/hoc/withAuth'
import { StudyProps } from '@/components/hoc/withStudy'
import withStudyDetails from '@/components/hoc/withStudyDetails'
import NewStudyRightPage from '@/components/pages/NewStudyRight'
import { getAccountRoleOnStudy, hasEditionRights } from '@/utils/study'
import { redirect } from 'next/navigation'

const NewStudyRight = async ({ study, user }: StudyProps & UserSessionProps) => {
  const userRoleOnStudy = await getAccountRoleOnStudy(user, study)
  if (!hasEditionRights(userRoleOnStudy)) {
    redirect(`/etudes/${study.id}/cadrage`)
  }

  return <NewStudyRightPage study={study} user={user} />
}

export default withAuth(withStudyDetails(NewStudyRight))
