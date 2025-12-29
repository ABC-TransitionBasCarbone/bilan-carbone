import withAuth, { UserSessionProps } from '@/components/hoc/withAuth'
import { StudyProps } from '@/components/hoc/withStudy'
import withStudyDetails from '@/components/hoc/withStudyDetails'
import EditStudyContributorPage from '@/components/pages/NewStudyContributor'
import { getAccountRoleOnStudy, hasEditionRights } from '@/utils/study'
import { redirect } from 'next/navigation'

const EditStudyContributor = async ({ study, user }: StudyProps & UserSessionProps) => {
  const userRoleOnStudy = await getAccountRoleOnStudy(user, study)
  if (!hasEditionRights(userRoleOnStudy)) {
    redirect(`/etudes/${study.id}/cadrage`)
  }

  return <EditStudyContributorPage study={study} />
}

export default withAuth(withStudyDetails(EditStudyContributor))
