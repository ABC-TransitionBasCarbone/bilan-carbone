'use client'

import type { FullStudy } from '@/db/study'
import DynamicComponent from '@/environments/core/utils/DynamicComponent'
import { Environment } from '@abc-transitionbascarbone/db-common/enums'
import { UserSession } from 'next-auth'
import dynamic from 'next/dynamic'
import Block from '../base/Block'
import StudyResultsContainerSummary from './results/StudyResultsContainerSummary'
import useStudySite from './site/useStudySite'
import StudyDetailsHeader from './StudyDetailsHeader'

const StudyResultsContainerSummaryPublicodes = dynamic(
  () => import('@/environments/simplified/study/results/StudyResultsContainerSummaryPublicodes'),
)

interface Props {
  user: UserSession
  canDeleteStudy?: boolean
  canDuplicateStudy?: boolean
  duplicableEnvironments: Environment[]
  study: FullStudy
  validatedOnly: boolean
  organizationVersionId: string | null
}

const StudyDetails = ({
  user,
  canDeleteStudy,
  canDuplicateStudy,
  duplicableEnvironments,
  study,
  validatedOnly,
  organizationVersionId,
}: Props) => {
  const { siteId, setSite } = useStudySite(study, true)

  return (
    <>
      <StudyDetailsHeader
        study={study}
        organizationVersionId={organizationVersionId}
        canDeleteStudy={canDeleteStudy}
        canDuplicateStudy={canDuplicateStudy}
        duplicableEnvironments={duplicableEnvironments}
        studySite={siteId}
        setSite={setSite}
      />
      <Block>
        <DynamicComponent
          environmentComponents={{
            [Environment.CUT]: <StudyResultsContainerSummaryPublicodes study={study} />,
          }}
          defaultComponent={
            <StudyResultsContainerSummary user={user} study={study} studySite={siteId} validatedOnly={validatedOnly} />
          }
        />
      </Block>
    </>
  )
}

export default StudyDetails
