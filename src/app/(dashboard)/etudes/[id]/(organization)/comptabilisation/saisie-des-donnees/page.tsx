import NotFound from '@/components/pages/NotFound'
import StudyContributionPage from '@/components/pages/StudyContribution'
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
const DataEntry = async (props: Props) => {
  const session = await auth()

  const params = await props.params
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
    const studyWithoutDetail = filterStudyDetail(session.user, study)
    return <StudyContributorPage study={studyWithoutDetail} user={session.user} />
  }

  return <StudyContributionPage study={study} />
}

export default DataEntry
