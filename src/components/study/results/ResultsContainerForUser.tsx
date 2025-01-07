'use server'

import { getMainStudy } from '@/db/study'
import { canReadStudy } from '@/services/permissions/study'
import { User } from 'next-auth'
import StudyResultsContainerSummary from './StudyResultsContainerSummary'

interface Props {
  user: User
  mainStudyOrganizationId: string
}

const ResultsContainerForUser = async ({ user, mainStudyOrganizationId }: Props) => {
  const study = await getMainStudy(mainStudyOrganizationId)
  const showResults = study && (await canReadStudy(user, study))

  return showResults ? <StudyResultsContainerSummary study={study} site="all" /> : null
}

export default ResultsContainerForUser
