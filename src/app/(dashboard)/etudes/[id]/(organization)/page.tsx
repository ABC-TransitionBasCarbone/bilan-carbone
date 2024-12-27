import withAuth, { UserProps } from '@/components/hoc/withAuth'
import NotFound from '@/components/pages/NotFound'
import StudyPage from '@/components/pages/Study'
import { getStudyById } from '@/db/study'
import { canReadStudy, canReadStudyDetail } from '@/services/permissions/study'
import { UUID } from 'crypto'
import { redirect } from 'next/navigation'

interface Props {
  params: Promise<{
    id: UUID
  }>
}

const StudyView = async (props: Props & UserProps) => {
  const params = await props.params

  const id = params.id
  if (!id) {
    return <NotFound />
  }

  const study = await getStudyById(id, props.user.organizationId)
  if (!study) {
    return <NotFound />
  }

  if (!(await canReadStudyDetail(props.user, study))) {
    if (!(await canReadStudy(props.user, study))) {
      return <NotFound />
    }
    return redirect(`/etudes/${study.id}/contributeur`)
  }

  return <StudyPage study={study} />
}

export default withAuth(StudyView)
