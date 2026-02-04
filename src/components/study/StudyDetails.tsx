'use client'

import { FullStudy } from '@/db/study'
import DynamicComponent from '@/environments/core/utils/DynamicComponent'
import { Environment } from '@prisma/client'
import { UserSession } from 'next-auth'
import dynamic from 'next/dynamic'
import Block from '../base/Block'
import useStudySite from './site/useStudySite'
import StudyDetailsHeader from './StudyDetailsHeader'

const StudyResultsContainerSummaryPublicodes = dynamic(
  () => import('@/environments/simplified/study/results/StudyResultsContainerSummaryPublicodes'),
)
const StudyResultsContainerSummary = dynamic(() => import('./results/StudyResultsContainerSummary'))

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
  const { studySite, setSite } = useStudySite(study, true)

  return (
    <>
      <StudyDetailsHeader
        study={study}
        organizationVersionId={organizationVersionId}
        canDeleteStudy={canDeleteStudy}
        canDuplicateStudy={canDuplicateStudy}
        duplicableEnvironments={duplicableEnvironments}
        studySite={studySite}
        setSite={setSite}
      />
      <Block>
        <DynamicComponent
          environmentComponents={{
            [Environment.CUT]: <StudyResultsContainerSummaryPublicodes study={study} />,
          }}
          defaultComponent={
            <StudyResultsContainerSummary
              user={user}
              study={study}
              studySite={studySite}
              validatedOnly={validatedOnly}
            />
          }
        />
      </Block>
    </>
  )
}

export default StudyDetails
