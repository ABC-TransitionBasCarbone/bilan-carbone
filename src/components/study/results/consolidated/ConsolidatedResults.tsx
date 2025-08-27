import { ResultsByPost } from '@/services/results/consolidated'
import { StudyResultUnit } from '@prisma/client'
import { useTranslations } from 'next-intl'
import ResultsTableAndGraphs from '../ResultsTableAndGraphs'
import ConsolidatedResultsTable from './ConsolidatedResultsTable'

interface Props {
  computedResults: ResultsByPost[]
  resultsUnit: StudyResultUnit
}

const ConsolidatedResults = ({ computedResults, resultsUnit }: Props) => {
  const t = useTranslations('study.results')
  const tPost = useTranslations('emissionFactors.post')
  const tResultUnits = useTranslations('study.results.units')

  return (
    <>
      <ResultsTableAndGraphs
        computedResults={computedResults.map((result) => ({
          ...result,
          children: result.subPosts.map((subPost) => ({ ...subPost, label: tPost(subPost.post) })),
        }))}
        resultsUnit={resultsUnit}
        title={t('consolidatedChartTitle', { unit: tResultUnits(resultsUnit) })}
        type="post"
        TableComponent={ConsolidatedResultsTable}
      />
      {/* <ConsolidatedResultsTable
        study={study}
        studySite={studySite}
        withDependencies={withDependencies}
        environment={environment}
        type={type}
        validatedOnly={validatedOnly}
      /> */}
    </>
  )
}

export default ConsolidatedResults
