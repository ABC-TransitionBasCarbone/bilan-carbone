import withAuth, { UserSessionProps } from '@/components/hoc/withAuth'
import withStudyDetails, { StudyProps } from '@/components/hoc/withStudyDetails'
import NewStudyContributorPage from '@/components/pages/NewStudyContributor'
import { hasEditionRights, NEWGetAccountRoleOnStudy } from '@/utils/study'
import { redirect } from 'next/navigation'

const NewStudyContributor = async ({ study, user, studyId }: StudyProps & UserSessionProps) => {
  const userRoleOnStudy = await NEWGetAccountRoleOnStudy(user, studyId)
  if (!hasEditionRights(userRoleOnStudy)) {
    redirect(`/etudes/${studyId}/cadrage`)
  }

  return <NewStudyContributorPage study={study} />
}

export default withAuth(withStudyDetails(NewStudyContributor))
