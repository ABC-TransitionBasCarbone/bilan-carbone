import { UUID } from 'crypto'
import { getStudyByUserAndId } from '@/db/study'
import { auth } from '@/services/auth'
import { Study } from '@prisma/client'
import NotFound from '@/components/study/NotFound'
import StudyDetails from '@/components/study/StudyDetails'

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

  const study: Study | null = await getStudyByUserAndId(session.user, id)

  if (!study) {
    return <NotFound />
  }

  return <StudyDetails study={study} />
}

export default StudyView
