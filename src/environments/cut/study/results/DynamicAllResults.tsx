'use client'

import AllResults from '@/components/study/results/AllResults'
import { EmissionFactorWithParts } from '@/db/emissionFactors'
import { FullStudy } from '@/db/study'
import DynamicComponent from '@/environments/core/utils/DynamicComponent'
import { default as AllResultsCUT } from '@/environments/cut/study/results/AllResults'
import { CUT } from '@/store/AppEnvironment'
import { ExportRule } from '@prisma/client'

interface Props {
  study: FullStudy
  rules: ExportRule[]
  emissionFactorsWithParts: EmissionFactorWithParts[]
  validatedOnly: boolean
}

export default function DynamicAllResults({ study, rules, emissionFactorsWithParts, validatedOnly }: Props) {
  return (
    <DynamicComponent
      environmentComponents={{
        [CUT]: (
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
