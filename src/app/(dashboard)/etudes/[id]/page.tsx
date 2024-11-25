import NotFound from '@/components/pages/NotFound'
import StudyPage from '@/components/pages/Study'
import StudyContributorPage from '@/components/pages/StudyContributor'
import { getStudyById } from '@/db/study'
import { auth } from '@/services/auth'
import { canReadStudy, canReadStudyDetail, filterStudyDetail } from '@/services/permissions/study'
import { UUID } from 'crypto'

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
