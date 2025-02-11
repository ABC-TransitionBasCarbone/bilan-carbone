import withAuth from '@/components/hoc/withAuth'
import { StudyProps } from '@/components/hoc/withStudy'
import withStudyDetails from '@/components/hoc/withStudyDetails'
import ResultsPage from '@/components/pages/Results'
import { getEmissionFactorsWithPartsInIds } from '@/db/emissionFactors'
import { getExportRules } from '@/db/exportRule'

const ResultatsPages = async ({ study }: StudyProps) => {
  const ids = study.emissionSources
    .map((emissionSource) => emissionSource.emissionFactor?.id)
    .filter((id) => id !== undefined)

  const [rules, emissionFactorsWithParts] = await Promise.all([getExportRules(), getEmissionFactorsWithPartsInIds(ids)])

  return <ResultsPage study={study} rules={rules} emissionFactorsWithParts={emissionFactorsWithParts} />
}

export default withAuth(withStudyDetails(ResultatsPages))
