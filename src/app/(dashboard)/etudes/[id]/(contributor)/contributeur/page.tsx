import withAuth, { UserSessionProps } from '@/components/hoc/withAuth'
import withStudy, { StudyProps } from '@/components/hoc/withStudy'
import NotFound from '@/components/pages/NotFound'
import StudyContributorPage from '@/components/pages/StudyContributor'
import { canReadStudy, canReadStudyDetail, filterStudyDetail } from '@/services/permissions/study'
import { getAccountRoleOnStudy } from '@/utils/study'
import { redirect } from 'next/navigation'

const StudyView = async ({ user, study }: StudyProps & UserSessionProps) => {
  if (!(await canReadStudy(user, study.id))) {
    return <NotFound />
  }

  if (await canReadStudyDetail(user, study)) {
    return redirect(`/etudes/${study.id}`)
  }

  const userRole = getAccountRoleOnStudy(user, study)

  const studyWithoutDetail = filterStudyDetail(user, study)
  return <StudyContributorPage study={studyWithoutDetail} userRole={userRole} />
}

export default withAuth(withStudy(StudyView))
