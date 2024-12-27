import withAuth, { UserProps } from '@/components/hoc/withAuth'
import NotFound from '@/components/pages/NotFound'
import StudyContributionPage from '@/components/pages/StudyContribution'
import StudyContributorPage from '@/components/pages/StudyContributor'
import { getStudyById } from '@/db/study'
import { canReadStudy, canReadStudyDetail, filterStudyDetail } from '@/services/permissions/study'
import { UUID } from 'crypto'

interface Props {
  params: Promise<{
    id: UUID
  }>
}
const DataEntry = async (props: Props & UserProps) => {
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
    const studyWithoutDetail = filterStudyDetail(props.user, study)
    return <StudyContributorPage study={studyWithoutDetail} user={props.user} />
  }

  return <StudyContributionPage study={study} />
}

export default withAuth(DataEntry)
