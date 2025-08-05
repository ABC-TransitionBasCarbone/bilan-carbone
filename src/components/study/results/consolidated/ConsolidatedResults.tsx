import { FullStudy } from '@/db/study'
import { ResultType } from '@/services/study'
import StudyResultsContainerSummary from '../StudyResultsContainerSummary'
import ConsolidatedResultsTable from './ConsolidatedResultsTable'

interface Props {
  study: FullStudy
  studySite: string
  withDependencies: boolean
  validatedOnly: boolean
  type?: ResultType
}

const ConsolidatedResults = ({ study, studySite, withDependencies, validatedOnly, type }: Props) => {
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
      <ConsolidatedResultsTable study={study} studySite={studySite} withDependencies={withDependencies} type={type} />
    </>
  )
}

export default ConsolidatedResults
