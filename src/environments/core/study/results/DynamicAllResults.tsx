'use client'

import AllResults from '@/components/study/results/AllResults'
import { EmissionFactorWithParts } from '@/db/emissionFactors'
import { FullStudy } from '@/db/study'
import DynamicComponent from '@/environments/core/utils/DynamicComponent'
import { default as AllResultsCUT } from '@/environments/cut/study/results/AllResults'
import { Environment, ExportRule } from '@prisma/client'

interface Props {
  study: FullStudy
  rules: ExportRule[]
  emissionFactorsWithParts: EmissionFactorWithParts[]
  validatedOnly: boolean
}

const DynamicAllResults = ({ study, rules, emissionFactorsWithParts, validatedOnly }: Props) => {
  return (
    <DynamicComponent
      environmentComponents={{
        [Environment.CUT]: (
          <AllResultsCUT
            emissionFactorsWithParts={emissionFactorsWithParts}
            study={study}
            validatedOnly={validatedOnly}
          />
        ),
      }}
      defaultComponent={
        <AllResults
          study={study}
          rules={rules}
          emissionFactorsWithParts={emissionFactorsWithParts}
          validatedOnly={validatedOnly}
        />
      }
    />
  )
}

export default DynamicAllResults
