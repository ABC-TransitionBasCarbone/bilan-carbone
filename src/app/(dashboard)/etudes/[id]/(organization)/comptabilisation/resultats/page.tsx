import withAuth from '@/components/hoc/withAuth'
import { StudyProps } from '@/components/hoc/withStudy'
import withStudyDetails from '@/components/hoc/withStudyDetails'
import ResultsPage from '@/components/pages/Results'
import { getEmissionFactorsWithPartsInIds } from '@/db/emissionFactors'
import { getExportRules } from '@/db/exportRule'
import { getUserSettings } from '@/services/serverFunctions/user'

const ResultatsPages = async ({ study }: StudyProps) => {
  const ids = study.emissionSources
    .map((emissionSource) => emissionSource.emissionFactor?.id)
    .filter((id) => id !== undefined)

  const [rules, emissionFactorsWithParts, userSettings] = await Promise.all([
    getExportRules(),
    getEmissionFactorsWithPartsInIds(ids),
    getUserSettings(),
  ])

  return (
    <ResultsPage
      study={study}
      rules={rules}
      emissionFactorsWithParts={emissionFactorsWithParts}
      validatedOnly={!!userSettings?.validatedEmissionSourcesOnly}
    />
  )
}

export default withAuth(withStudyDetails(ResultatsPages))
