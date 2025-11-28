import { ResultsByPost } from '@/services/results/consolidated'
import { StudyResultUnit } from '@prisma/client'
import { useTranslations } from 'next-intl'
import ResultsTableAndGraphs from '../ResultsTableAndGraphs'
import ConsolidatedResultsTable from './ConsolidatedResultsTable'

interface Props {
  computedResults: ResultsByPost[]
  resultsUnit: StudyResultUnit
  exportType: string
}

const ConsolidatedResults = ({ computedResults, resultsUnit, exportType }: Props) => {
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
        exportType={exportType}
      />
    </>
  )
}

export default ConsolidatedResults
