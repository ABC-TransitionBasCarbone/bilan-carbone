import NotFound from '@/components/pages/NotFound'
import ResultsPage from '@/components/pages/Results'
import { getStudyById } from '@/db/study'
import { auth } from '@/services/auth'
import { canReadStudyDetail } from '@/services/permissions/study'
import { UUID } from 'crypto'

interface Props {
  params: Promise<{
    id: UUID
  }>
}
const ResultatsPages = async (props: Props) => {
  const session = await auth()

  const params = await props.params
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

  return <ResultsPage study={study} />
}

export default ResultatsPages
