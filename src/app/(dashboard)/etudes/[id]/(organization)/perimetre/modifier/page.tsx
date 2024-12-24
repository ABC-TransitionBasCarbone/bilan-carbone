import EditStudyPerimeterPage from '@/components/pages/EditStudyPerimeter'
import NotFound from '@/components/pages/NotFound'
import { getStudyById } from '@/db/study'
import { getUserOrganizations } from '@/db/user'
import { auth } from '@/services/auth'
import { UUID } from 'crypto'

interface Props {
  params: Promise<{ id: UUID }>
}

const UpdateStudyPerimeter = async (props: Props) => {
  const params = await props.params
  const session = await auth()
  const id = params.id
  if (!session || !session.user.organizationId) {
    return null
  }

  if (!id || !session) {
    return <NotFound />
  }

  const [study, organizations] = await Promise.all([
    getStudyById(id, session.user.organizationId),
    getUserOrganizations(session.user.email),
  ])

  if (!study || organizations.length === 0) {
    return <NotFound />
  }

  return <EditStudyPerimeterPage study={study} organization={organizations[0]} />
}

export default UpdateStudyPerimeter
