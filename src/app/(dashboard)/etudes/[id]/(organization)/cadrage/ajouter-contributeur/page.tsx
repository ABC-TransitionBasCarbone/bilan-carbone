import NewStudyContributorPage from '@/components/pages/NewStudyContributor'
import NotFound from '@/components/pages/NotFound'
import { getStudyById } from '@/db/study'
import { auth } from '@/services/auth'
import { canReadStudyDetail } from '@/services/permissions/study'
import { UUID } from 'crypto'

interface Props {
  params: Promise<{
    id: UUID
  }>
}

const NewStudyContributor = async (props: Props) => {
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
  return <NewStudyContributorPage study={study} />
}

export default NewStudyContributor
