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
  let mainStudy = null
  for (const study of studies) {
    const result = await canReadStudy(user, study.id)
    if (result) {
      mainStudy = study
      break
    }
  }
  return mainStudy ? (
    <Block>
      <StudyResultsContainerSummary study={mainStudy} studySite="all" />
    </Block>
  ) : null
}

export default ResultsContainerForUser
