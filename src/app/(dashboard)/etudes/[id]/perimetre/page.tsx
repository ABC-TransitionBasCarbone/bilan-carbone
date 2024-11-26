import NotFound from '@/components/pages/NotFound'
import StudyPerimeterPage from '@/components/pages/StudyPerimeter'
import { getOrganizationWithSitesById } from '@/db/organization'
import { getStudyById } from '@/db/study'
import { auth } from '@/services/auth'
import { canReadStudyDetail } from '@/services/permissions/study'
import { UUID } from 'crypto'

interface Props {
  params: Promise<{
    id: UUID
  }>
}

const StudyPerimeter = async (props: Props) => {
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
    return <NotFound />
  }

  const organization = await getOrganizationWithSitesById(study.organizationId)
  if (!organization) {
    return <NotFound />
  }

  return <StudyPerimeterPage study={study} user={session.user} organization={organization} />
}

export default StudyPerimeter
