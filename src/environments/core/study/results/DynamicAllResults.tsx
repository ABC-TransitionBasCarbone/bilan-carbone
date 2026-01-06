'use client'

import AllResults from '@/components/study/results/AllResults'
import { EmissionFactorWithParts } from '@/db/emissionFactors'
import { FullStudy } from '@/db/study'
import DynamicComponent from '@/environments/core/utils/DynamicComponent'
import AllResultsSimplified from '@/environments/simplified/study/results/AllResults'
import AllResultsTilt from '@/environments/tilt/study/results/AllResults'
import { Environment, ExportRule, SiteCAUnit } from '@prisma/client'

interface Props {
  study: FullStudy
  rules: ExportRule[]
  emissionFactorsWithParts: EmissionFactorWithParts[]
  validatedOnly: boolean
  caUnit?: SiteCAUnit
}

const DynamicAllResults = ({ study, rules, emissionFactorsWithParts, validatedOnly, caUnit }: Props) => {
  return (
    <DynamicComponent
      environmentComponents={{
        [Environment.CUT]: (
          <AllResultsSimplified
            emissionFactorsWithParts={emissionFactorsWithParts}
            study={study}
            validatedOnly={validatedOnly}
          />
        ),
        [Environment.CLICKSON]: (
          <AllResultsSimplified
            showSubLevel={true}
            emissionFactorsWithParts={emissionFactorsWithParts}
            study={study}
            validatedOnly={validatedOnly}
            caUnit={caUnit}
            chartOrder={{
              bar: 0,
              pie: 1,
              table: 2,
              ratio: 3,
            }}
          />
        ),
        [Environment.TILT]: (
          <AllResultsTilt
            study={study}
            rules={rules}
            emissionFactorsWithParts={emissionFactorsWithParts}
            validatedOnly={validatedOnly}
            caUnit={caUnit}
          />
        ),
      }}
      defaultComponent={
        <AllResults
          study={study}
          rules={rules}
          emissionFactorsWithParts={emissionFactorsWithParts}
          validatedOnly={validatedOnly}
          caUnit={caUnit}
        />
      }
    />
  )
}

export default DynamicAllResults
