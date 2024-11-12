import { UUID } from 'crypto'
import { auth } from '@/services/auth'
import NotFound from '@/components/study/NotFound'
import { canReadStudy } from '@/services/permissions/study'
import { getStudyWithRightsById } from '@/db/study'
import StudyPage from '@/components/pages/Study'

interface Props {
  params: {
    id: UUID
  }
}

const StudyView = async ({ params }: Props) => {
  const session = await auth()

  const id = params.id
  if (!id || !session) {
    return <NotFound />
  }

  const study = await getStudyWithRightsById(id)

  if (!study) {
    return <NotFound />
  }

  if (!(await canReadStudy(session.user, study))) {
    return <NotFound />
  }

  return <StudyPage study={study} />
}

export default StudyView
