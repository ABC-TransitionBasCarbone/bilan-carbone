import { UUID } from 'crypto'
import { getStudyByUserAndId } from '@/db/study'
import { auth } from '@/services/auth'
import NotFound from '@/components/study/NotFound'
import StudyDetails from '@/components/study/StudyDetails'
import { canReadStudy } from '@/services/permissions/study'

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

  const study = await getStudyByUserAndId(session.user, id)

  if (!study) {
    return <NotFound />
  }

  if (!(await canReadStudy(session.user, study))) {
    return <NotFound />
  }

  return <StudyDetails study={study} />
}

export default StudyView
