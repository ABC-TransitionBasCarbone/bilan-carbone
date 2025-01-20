'use server'

import Block from '@/components/base/Block'
import { getOrganizationStudiesOrderedByStartDate } from '@/db/study'
import { canReadStudy } from '@/services/permissions/study'
import { User } from 'next-auth'
import StudyResultsContainerSummary from './StudyResultsContainerSummary'

interface Props {
  user: User
  mainStudyOrganizationId: string
}

const ResultsContainerForUser = async ({ user, mainStudyOrganizationId }: Props) => {
  const studies = await getOrganizationStudiesOrderedByStartDate(mainStudyOrganizationId)
  const study = studies.find((study) => canReadStudy(user, study))

  return study ? (
    <Block>
      <StudyResultsContainerSummary study={study} site="all" />
    </Block>
  ) : null
}

export default ResultsContainerForUser
