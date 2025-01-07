import { FullStudy } from '@/db/study'
import StudyResultsContainerSummary from '../StudyResultsContainerSummary'
import ConsolidatedResultsTable from './ConsolidatedResultsTable'

interface Props {
  study: FullStudy
  site: string
  withDependencies: boolean
}

const ConsolidatedResults = ({ study, site, withDependencies }: Props) => {
  return (
    <>
      <div className="mb1">
        <StudyResultsContainerSummary study={study} site={site} withDependencies={withDependencies} />
      </div>
      <ConsolidatedResultsTable study={study} site={site} withDependencies={withDependencies} />
    </>
  )
}

export default ConsolidatedResults
