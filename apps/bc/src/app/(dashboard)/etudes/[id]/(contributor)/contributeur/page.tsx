import withAuth, { UserSessionProps } from '@/components/hoc/withAuth'
import WithStudyContributors from '@/components/hoc/withStudyContributors'
import { StudyProps } from '@/components/hoc/withStudyDetails'
import StudyContributorPage from '@/components/pages/StudyContributor'
import { canReadStudy, canReadStudyDetail, filterStudyEmissionSources } from '@/services/permissions/study.server'
import { getAccountRoleOnStudy } from '@/utils/study'
import NotFound from '@abc-transitionbascarbone/common/components/pages/NotFound'
import { redirect } from 'next/navigation'

const StudyView = async ({ user, study }: StudyProps & UserSessionProps) => {
  if (!(await canReadStudy(user, study.id))) {
    return <NotFound />
  }

  if (await canReadStudyDetail(user, study)) {
    return redirect(`/etudes/${study.id}`)
  }

  const userRole = getAccountRoleOnStudy(user, study)

  const studyWithoutDetail = filterStudyEmissionSources(user, study)
  return <StudyContributorPage study={studyWithoutDetail} userRole={userRole} />
}

export default withAuth(WithStudyContributors(StudyView))
