import { FullStudy } from '@/db/study'
import StudyResultsContainerSummary from '../StudyResultsContainerSummary'
import ConsolidatedResultsTable from './ConsolidatedResultsTable'

interface Props {
  study: FullStudy
  studySite: string
  withDependencies: boolean
  validatedOnly: boolean
}

const ConsolidatedResults = ({ study, studySite, withDependencies, validatedOnly }: Props) => {
  return (
    <>
      <div className="mb1">
        <StudyResultsContainerSummary
          study={study}
          studySite={studySite}
          withDependencies={withDependencies}
          validatedOnly={validatedOnly}
        />
      </div>
      <ConsolidatedResultsTable study={study} studySite={studySite} withDependencies={withDependencies} />
    </>
  )
}

export default ConsolidatedResults
