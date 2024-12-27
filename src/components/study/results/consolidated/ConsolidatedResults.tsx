import { FullStudy } from '@/db/study'
import ResultsContainerForStudy from '../ResultsContainerForStudy'
import ConsolidatedResultsTable from './ConsolidatedResultsTable'

interface Props {
  study: FullStudy
  site: string
  withDependancies: boolean
}

const ConsolidatedResults = ({ study, site, withDependancies }: Props) => {
  return (
    <>
      <div className="mb1">
        <ResultsContainerForStudy study={study} site={site} withDependancies={withDependancies} />
      </div>
      <ConsolidatedResultsTable study={study} site={site} withDependencies={withDependancies} />
    </>
  )
}

export default ConsolidatedResults
