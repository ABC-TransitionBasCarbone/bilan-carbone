import { UUID } from 'crypto'
import { auth } from '@/services/auth'
import NotFound from '@/components/pages/NotFound'
import { canReadStudy, canReadStudyDetail, filterStudyDetail } from '@/services/permissions/study'
import { getStudyById } from '@/db/study'
import StudyPage from '@/components/pages/Study'
import StudyContributorPage from '@/components/pages/StudyContributor'

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

  if (!(await canReadStudyDetail(session.user, study))) {
    if (!(await canReadStudy(session.user, study))) {
      return <NotFound />
    }
    const studyWithoutDetail = filterStudyDetail(session.user, study)
    return <StudyContributorPage study={studyWithoutDetail} user={session.user} />
  }

  return <StudyPage study={study} />
}

export default StudyView
