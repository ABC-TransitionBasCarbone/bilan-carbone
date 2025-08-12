'use client'

import Block from '@/components/base/Block'
import { FullStudy } from '@/db/study'
import StudyResultsContainerSummary from './StudyResultsContainerSummary'
import { AdditionalResultTypes } from '@/services/study'

interface Props {
  study: FullStudy
  validatedOnly: boolean
}

const StudyResultsContainer = ({ study, validatedOnly }: Props) => {
  return (
    <Block>
      <StudyResultsContainerSummary study={study} validatedOnly={validatedOnly} studySite={'all'} type={AdditionalResultTypes.ENV_SPECIFIC_EXPORT} />
    </Block>
  )
}

export default StudyResultsContainer
