import withAuth, { UserProps } from '@/components/hoc/withAuth'
import withStudy, { StudyProps } from '@/components/hoc/withStudy'
import NotFound from '@/components/pages/NotFound'
import StudyContributorPage from '@/components/pages/StudyContributor'
import { canReadStudy, canReadStudyDetail, filterStudyDetail } from '@/services/permissions/study'
import { redirect } from 'next/navigation'

const StudyView = async ({ user, study }: StudyProps & UserProps) => {
  if (!(await canReadStudy(user, study.id))) {
    return <NotFound />
  }

  if (await canReadStudyDetail(user, study)) {
    return redirect(`/etudes/${study.id}`)
  }

  const studyWithoutDetail = filterStudyDetail(user, study)
  return <StudyContributorPage study={studyWithoutDetail} user={user} />
}

export default withAuth(withStudy(StudyView))
