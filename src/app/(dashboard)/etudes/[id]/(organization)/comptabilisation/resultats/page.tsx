import withAuth, { UserProps } from '@/components/hoc/withAuth'
import withStudy, { StudyProps } from '@/components/hoc/withStudy'
import ResultsPage from '@/components/pages/Results'
import { getEmissionFactorsWithPartsInIds } from '@/db/emissionFactors'
import { getExportRules } from '@/db/exportRule'

const ResultatsPages = async (props: StudyProps & UserProps) => {
  const ids = props.study.emissionSources
    .map((emissionSource) => emissionSource.emissionFactor?.id)
    .filter((id) => id !== undefined)
  const [rules, emissionFactorsWithParts] = await Promise.all([getExportRules(), getEmissionFactorsWithPartsInIds(ids)])

  return <ResultsPage study={props.study} rules={rules} emissionFactorsWithParts={emissionFactorsWithParts} />
}

export default withAuth(withStudy(ResultatsPages))
