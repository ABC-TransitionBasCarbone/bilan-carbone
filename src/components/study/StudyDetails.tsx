'use client'

import { FullStudy } from '@/db/study'
import Block from '../base/Block'
import StudyResultsContainerSummary from './results/StudyResultsContainerSummary'
import useStudySite from './site/useStudySite'
import StudyDetailsHeader from './StudyDetailsHeader'

interface Props {
  study: FullStudy
}

const StudyDetails = ({ study }: Props) => {
  const { studySite, setSite } = useStudySite(study, true)

  return (
    <>
      <StudyDetailsHeader study={study} studySite={studySite} setSite={setSite} />
      <Block>
        <StudyResultsContainerSummary study={study} studySite={studySite} />
      </Block>
    </>
  )
}

export default StudyDetails
