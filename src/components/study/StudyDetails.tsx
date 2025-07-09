'use client'

import { FullStudy } from '@/db/study'
import DynamicComponent from '@/environments/core/utils/DynamicComponent'
import StudyResultsContainerSummaryCut from '@/environments/cut/study/results/StudyResultsContainerSummaryCut'
import { Environment } from '@prisma/client'
import Block from '../base/Block'
import StudyResultsContainerSummary from './results/StudyResultsContainerSummary'
import useStudySite from './site/useStudySite'
import StudyDetailsHeader from './StudyDetailsHeader'

interface Props {
  canDeleteStudy?: boolean
  canDuplicateStudy?: boolean
  study: FullStudy
  validatedOnly: boolean
  organizationVersionId: string | null
}

const StudyDetails = ({ canDeleteStudy, canDuplicateStudy, study, validatedOnly, organizationVersionId }: Props) => {
  const { studySite, setSite } = useStudySite(study, true)

  return (
    <>
      <StudyDetailsHeader
        study={study}
        organizationVersionId={organizationVersionId}
        canDeleteStudy={canDeleteStudy}
        canDuplicateStudy={canDuplicateStudy}
        studySite={studySite}
        setSite={setSite}
      />
      <Block>
        <DynamicComponent
          environmentComponents={{
            [Environment.CUT]: <StudyResultsContainerSummaryCut study={study} />,
          }}
          defaultComponent={
            <StudyResultsContainerSummary study={study} studySite={studySite} validatedOnly={validatedOnly} />
          }
        />
      </Block>
    </>
  )
}

export default StudyDetails
