'use client'

import { FullStudy } from '@/db/study'
import { defaultStudyResultUnit } from '@/utils/number'
import { StudyResultUnit } from '@prisma/client'
import Block from '../base/Block'
import StudyResultsContainerSummary from './results/StudyResultsContainerSummary'
import useStudySite from './site/useStudySite'
import StudyDetailsHeader from './StudyDetailsHeader'

interface Props {
  canDeleteStudy?: boolean
  study: FullStudy
  unit?: StudyResultUnit
}

const StudyDetails = ({ canDeleteStudy, study, unit = defaultStudyResultUnit }: Props) => {
  const { studySite, setSite } = useStudySite(study, true)

  return (
    <>
      <StudyDetailsHeader
        study={study}
        canDeleteStudy={canDeleteStudy}
        studySite={studySite}
        setSite={setSite}
        unit={unit}
      />
      <Block>
        <StudyResultsContainerSummary study={study} studySite={studySite} unit={unit} />
      </Block>
    </>
  )
}

export default StudyDetails
