'use client'

import Block from '@/components/base/Block'
import { FullStudy } from '@/db/study'
import StudyResultsContainerSummary from './StudyResultsContainerSummary'

interface Props {
  study: FullStudy
  validatedOnly: boolean
}

const StudyResultsContainer = ({ study, validatedOnly }: Props) => {
  return (
    <Block>
      <StudyResultsContainerSummary study={study} validatedOnly={validatedOnly} studySite={'all'} />
    </Block>
  )
}

export default StudyResultsContainer
