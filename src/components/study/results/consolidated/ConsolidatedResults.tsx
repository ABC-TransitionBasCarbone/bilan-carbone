import { FullStudy } from '@/db/study'
import { ResultType } from '@/services/study'
import { Environment } from '@prisma/client'
import ConsolidatedResultsTable from './ConsolidatedResultsTable'

interface Props {
  study: FullStudy
  studySite: string
  withDependencies: boolean
  validatedOnly: boolean
  environment: Environment | undefined
  type?: ResultType
}

const ConsolidatedResults = ({ study, studySite, withDependencies, validatedOnly, environment, type }: Props) => {
  return (
    <>
      {/* <div className="mb1">
        <StudyResultsContainerSummary
          study={study}
          studySite={studySite}
          withDependencies={withDependencies}
          validatedOnly={validatedOnly}
          type={type}
        />
      </div> */}
      <ConsolidatedResultsTable
        study={study}
        studySite={studySite}
        withDependencies={withDependencies}
        environment={environment}
        type={type}
      />
    </>
  )
}

export default ConsolidatedResults
