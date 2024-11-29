import NotFound from '@/components/pages/NotFound'
import StudyContributorPage from '@/components/pages/StudyContributor'
import { getStudyById } from '@/db/study'
import { auth } from '@/services/auth'
import { canReadStudy, canReadStudyDetail, filterStudyDetail } from '@/services/permissions/study'
import { UUID } from 'crypto'
import { redirect } from 'next/navigation'

interface Props {
  params: Promise<{
    id: UUID
  }>
}

const StudyView = async (props: Props) => {
  const params = await props.params
  const session = await auth()

  const id = params.id
  if (!id || !session) {
    return <NotFound />
  }

  const study = await getStudyById(id)

  if (!study) {
    return <NotFound />
  }

  if (!(await canReadStudy(session.user, study))) {
    return <NotFound />
  }

  if (await canReadStudyDetail(session.user, study)) {
    return redirect(`/etudes/${study.id}`)
  }

  const studyWithoutDetail = filterStudyDetail(session.user, study)
  return <StudyContributorPage study={studyWithoutDetail} user={session.user} />
}

export default StudyView
