import NotFound from '@/components/pages/NotFound'
import ResultsPage from '@/components/pages/Results'
import { getEmissionFactorsWithPartsInIds } from '@/db/emissionFactors'
import { getExportRules } from '@/db/exportRule'
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

  const study = await getStudyById(id, session.user.organizationId as string)

  if (!study) {
    return <NotFound />
  }

  if (!(await canReadStudyDetail(session.user, study))) {
    return <NotFound />
  }

  const ids = study.emissionSources
    .map((emissionSource) => emissionSource.emissionFactor?.id)
    .filter((id) => id !== undefined)
  const [rules, emissionFactorsWithParts] = await Promise.all([getExportRules(), getEmissionFactorsWithPartsInIds(ids)])

  return <ResultsPage study={study} rules={rules} emissionFactorsWithParts={emissionFactorsWithParts} />
}

export default ResultatsPages
