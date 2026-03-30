import { ResultsByPost } from '@/types/study.types'
import { StudyResultUnit } from '@repo/db-common'
import { useTranslations } from 'next-intl'
import ResultsTableAndGraphs from '../ResultsTableAndGraphs'
import ConsolidatedResultsTable from './ConsolidatedResultsTable'

interface Props {
  computedResults: ResultsByPost[]
  resultsUnit: StudyResultUnit
}

const ConsolidatedResults = ({ computedResults, resultsUnit }: Props) => {
  const t = useTranslations('study.results')
  const tResultUnits = useTranslations('study.results.units')

  return (
    <>
      <ResultsTableAndGraphs
        computedResults={computedResults}
        resultsUnit={resultsUnit}
        title={t('consolidatedChartTitle', { unit: tResultUnits(resultsUnit) })}
        type="post"
        TableComponent={ConsolidatedResultsTable}
      />
    </>
  )
}

export default ConsolidatedResults
