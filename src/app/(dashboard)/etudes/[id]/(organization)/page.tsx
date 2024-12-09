import NotFound from '@/components/pages/NotFound'
import StudyPage from '@/components/pages/Study'
import { getStudyById } from '@/db/study'
import { auth } from '@/services/auth'
import { canReadStudy, canReadStudyDetail } from '@/services/permissions/study'
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

  const study = await getStudyById(id, session.user.organizationId)

  if (!study) {
    return <NotFound />
  }

  if (!(await canReadStudyDetail(session.user, study))) {
    if (!(await canReadStudy(session.user, study))) {
      return <NotFound />
    }
    return redirect(`/etudes/${study.id}/contributeur`)
  }

  return <StudyPage study={study} />
}

export default StudyView
