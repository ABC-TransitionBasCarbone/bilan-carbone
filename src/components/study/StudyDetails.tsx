'use client'

import { FullStudy } from '@/db/study'
import Block from '../base/Block'
import StudyResultsContainerSummary from './results/StudyResultsContainerSummary'
import useStudySite from './site/useStudySite'
import StudyDetailsHeader from './StudyDetailsHeader'

interface Props {
  canDeleteStudy?: boolean
  study: FullStudy
  validatedOnly: boolean
}

const StudyDetails = ({ canDeleteStudy, study, validatedOnly }: Props) => {
  const { studySite, setSite } = useStudySite(study, true)

  return (
    <>
      <StudyDetailsHeader study={study} canDeleteStudy={canDeleteStudy} studySite={studySite} setSite={setSite} />
      <Block>
        <StudyResultsContainerSummary study={study} studySite={studySite} validatedOnly={validatedOnly} />
      </Block>
    </>
  )
}

export default StudyDetails
