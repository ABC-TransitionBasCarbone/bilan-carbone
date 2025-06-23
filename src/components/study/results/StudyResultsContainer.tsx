'use client'

import Block from '@/components/base/Block'
import { FullStudy } from '@/db/study'
import DynamicComponent from '@/environments/core/utils/DynamicComponent'
import { Environment } from '@prisma/client'
import StudyResultsContainerSummary from './StudyResultsContainerSummary'

interface Props {
  study: FullStudy
  validatedOnly: boolean
}

const StudyResultsContainer = ({ study, validatedOnly }: Props) => {
  return (
    <>
      <Block>
        <DynamicComponent
          environmentComponents={{
            [Environment.CUT]: (
              <StudyResultsContainerSummary study={study} validatedOnly={validatedOnly} studySite={'all'} />
            ),
          }}
          defaultComponent={
            <StudyResultsContainerSummary study={study} validatedOnly={validatedOnly} studySite={'all'} />
          }
        />
      </Block>
    </>
  )
}

export default StudyResultsContainer
