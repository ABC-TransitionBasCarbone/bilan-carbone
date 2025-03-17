import { FullStudy } from '@/db/study'
import { StudyResultUnit } from '@prisma/client'
import StudyResultsContainerSummary from '../StudyResultsContainerSummary'
import ConsolidatedResultsTable from './ConsolidatedResultsTable'

interface Props {
  study: FullStudy
  studySite: string
  withDependencies: boolean
  unit?: StudyResultUnit
}

const ConsolidatedResults = ({ study, studySite, withDependencies, unit }: Props) => {
  return (
    <>
      <div className="mb1">
        <StudyResultsContainerSummary
          study={study}
          studySite={studySite}
          withDependencies={withDependencies}
          unit={unit}
        />
      </div>
      <ConsolidatedResultsTable study={study} studySite={studySite} withDependencies={withDependencies} />
    </>
  )
}

export default ConsolidatedResults
