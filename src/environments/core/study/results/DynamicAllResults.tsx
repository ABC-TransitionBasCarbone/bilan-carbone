'use client'

import { EmissionFactorWithParts } from '@/db/emissionFactors'
import { FullStudy } from '@/db/study'
import DynamicComponent from '@/environments/core/utils/DynamicComponent'
import { Environment, ExportRule, SiteCAUnit } from '@prisma/client'
import dynamic from 'next/dynamic'
import { typeDynamicComponent } from '../../utils/dynamicUtils'

const AllResults = dynamic(() => import('@/components/study/results/AllResults'))
const AllResultsSimplified = dynamic(() => import('@/environments/simplified/study/results/AllResults'))
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
      environment={study.organizationVersion.environment}
      environmentComponents={{
        [Environment.CUT]: typeDynamicComponent({
          component: AllResultsSimplified,
          props: {
            emissionFactorsWithParts,
            study,
            validatedOnly,
          },
        }),
        [Environment.CLICKSON]: typeDynamicComponent({
          component: AllResultsSimplified,
          props: {
            showSubLevel: true,
            emissionFactorsWithParts,
            study,
            validatedOnly,
            caUnit,
            chartOrder: {
              bar: 0,
              pie: 1,
              table: 2,
              ratio: 3,
            },
          },
        }),
        [Environment.TILT]: typeDynamicComponent({
          component: AllResultsTilt,
          props: {
            study,
            rules,
            emissionFactorsWithParts,
            validatedOnly,
            caUnit,
            chartOrder: {
              bar: 0,
              pie: 1,
              table: 2,
              ratio: 3,
            },
          },
        }),
      }}
      defaultComponent={typeDynamicComponent({
        component: AllResults,
        props: {
          study,
          rules,
          emissionFactorsWithParts,
          validatedOnly,
          caUnit,
        },
      })}
    />
  )
}

export default DynamicAllResults
