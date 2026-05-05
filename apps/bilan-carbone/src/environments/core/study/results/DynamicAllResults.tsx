'use client'

import { EmissionFactorWithParts } from '@/db/emissionFactors'
import type { FullStudy } from '@/db/study'
import DynamicComponent from '@/environments/core/utils/DynamicComponent'
import type { ExportRule } from '@repo/db-common'
import { Environment, SiteCAUnit } from '@repo/db-common/enums'
import dynamic from 'next/dynamic'

const AllResults = dynamic(() => import('@/components/study/results/AllResults'))
const AllResultsPublicodes = dynamic(() => import('@/environments/simplified/study/results/AllResultsPublicodes'))
const AllResultsTilt = dynamic(() => import('@/environments/tilt/study/results/AllResults'))

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
        [Environment.CUT]: <AllResultsPublicodes study={study} />,
        [Environment.CLICKSON]: (
          <AllResultsPublicodes
            showSubLevel={true}
            study={study}
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
            chartOrder={{
              bar: 0,
              pie: 1,
              table: 2,
              ratio: 3,
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
