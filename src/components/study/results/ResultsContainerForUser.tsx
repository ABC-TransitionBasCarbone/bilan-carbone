'use server'

import Block from '@/components/base/Block'
import { getOrganizationStudiesOrderedByStartDate } from '@/db/study'
import { getUserApplicationSettings } from '@/db/user'
import { canReadStudy } from '@/services/permissions/study'
import { UserSession } from 'next-auth'
import StudyResultsContainerSummary from './StudyResultsContainerSummary'

interface Props {
  user: UserSession
  mainStudyOrganizationId: string
}

const ResultsContainerForUser = async ({ user, mainStudyOrganizationId }: Props) => {
  const [studies, settings] = await Promise.all([
    getOrganizationStudiesOrderedByStartDate(mainStudyOrganizationId),
    getUserApplicationSettings(user.accountId),
  ])
  let mainStudy = null
  for (const study of studies) {
    const result = await canReadStudy(user, study.id)
    if (result) {
      mainStudy = study
      break
    }
  }
  return (
    <Block>
      {mainStudy ? (
        <StudyResultsContainerSummary
          study={mainStudy}
          studySite="all"
          showTitle
          validatedOnly={settings.validatedEmissionSourcesOnly}
        />
      ) : null}
    </Block>
  )
}

export default ResultsContainerForUser
