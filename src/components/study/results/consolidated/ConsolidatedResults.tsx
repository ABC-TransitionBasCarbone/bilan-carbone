import { FullStudy } from '@/db/study'
import ResultsContainerForStudy from '../ResultsContainerForStudy'
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
        <ResultsContainerForStudy study={study} site={site} withDependencies={withDependencies} />
      </div>
      <ConsolidatedResultsTable study={study} site={site} withDependencies={withDependencies} />
    </>
  )
}

export default ConsolidatedResults
