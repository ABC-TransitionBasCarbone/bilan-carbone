'use client'

import { FullStudy } from '@/db/study'
import DynamicComponent from '@/environments/core/utils/DynamicComponent'
import { typeDynamicComponent } from '@/environments/core/utils/dynamicUtils'
import { Environment } from '@prisma/client'
import { UserSession } from 'next-auth'
import dynamic from 'next/dynamic'
import Block from '../base/Block'
import useStudySite from './site/useStudySite'
import StudyDetailsHeader from './StudyDetailsHeader'

const StudyResultsContainerSummaryCut = dynamic(
  () => import('@/environments/cut/study/results/StudyResultsContainerSummaryCut'),
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
            [Environment.CUT]: typeDynamicComponent({ component: StudyResultsContainerSummaryCut, props: { study } }),
          }}
          defaultComponent={typeDynamicComponent({
            component: StudyResultsContainerSummary,
            props: { user, study, studySite, validatedOnly },
          })}
          environment={study.organizationVersion.environment}
        />
      </Block>
    </>
  )
}

export default StudyDetails
