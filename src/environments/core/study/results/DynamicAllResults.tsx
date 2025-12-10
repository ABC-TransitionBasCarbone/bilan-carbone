'use client'

import AllResults from '@/components/study/results/AllResults'
import { EmissionFactorWithParts } from '@/db/emissionFactors'
import { FullStudy } from '@/db/study'
import DynamicComponent from '@/environments/core/utils/DynamicComponent'
import AllResultsSimplified from '@/environments/simplified/study/results/AllResults'
import { Environment, ExportRule, SiteCAUnit } from '@prisma/client'

interface Props {
  study: FullStudy
  rules: ExportRule[]
  emissionFactorsWithParts: EmissionFactorWithParts[]
  validatedOnly: boolean
  caUnit?: SiteCAUnit
}

const a11yProps = (index: number) => {
  return {
    id: `full-width-tab-${index}`,
    'aria-controls': `full-width-tabpanel-${index}`,
  }
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
            emissionFactorsWithParts={emissionFactorsWithParts}
            study={study}
            validatedOnly={validatedOnly}
            chartOrder={{
              bar: 0,
              pie: 1,
              table: 2,
            }}
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
