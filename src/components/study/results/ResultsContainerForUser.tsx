'use server'

import Block from '@/components/base/Block'
import { getOrganizationVersionStudiesOrderedByStartDate } from '@/db/study'
import { getUserApplicationSettings } from '@/db/user'
import { canReadStudy } from '@/services/permissions/study'
import { UserSession } from 'next-auth'
import StudyResultsContainerSummary from './StudyResultsContainerSummary'

interface Props {
  user: UserSession
  mainStudyOrganizationVersionId: string
}

const ResultsContainerForUser = async ({ user, mainStudyOrganizationVersionId }: Props) => {
  const [studies, settings] = await Promise.all([
    getOrganizationVersionStudiesOrderedByStartDate(mainStudyOrganizationVersionId),
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
