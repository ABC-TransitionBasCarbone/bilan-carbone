import { FullStudy } from '@/db/study'
import StudyResultsContainerSummary from '../StudyResultsContainerSummary'
import ConsolidatedResultsTable from './ConsolidatedResultsTable'

interface Props {
  study: FullStudy
  studySite: string
  withDependencies: boolean
}

const ConsolidatedResults = ({ study, studySite, withDependencies }: Props) => {
  return (
    <>
      <div className="mb1">
        <StudyResultsContainerSummary study={study} studySite={studySite} withDependencies={withDependencies} />
      </div>
      <ConsolidatedResultsTable study={study} studySite={studySite} withDependencies={withDependencies} />
    </>
  )
}

export default ConsolidatedResults
