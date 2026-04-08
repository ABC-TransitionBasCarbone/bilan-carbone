'use client'

import Block from '@/components/base/Block'
import { FullStudy } from '@/db/study'
import { UserSession } from 'next-auth'
import StudyResultsContainerSummary from './StudyResultsContainerSummary'

interface Props {
  user: UserSession
  study: FullStudy
  validatedOnly: boolean
}

const StudyResultsContainer = ({ user, study, validatedOnly }: Props) => {
  return (
    <Block>
      <StudyResultsContainerSummary user={user} study={study} validatedOnly={validatedOnly} studySite={'all'} />
    </Block>
  )
}

export default StudyResultsContainer
