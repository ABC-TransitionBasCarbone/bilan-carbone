import AllResultsAdvanced from '@/components/study/results/AllResults'
import { EmissionFactorWithParts } from '@/db/emissionFactors'
import { FullStudy } from '@/db/study'
import AllResultsSimplifiedFromEmissionsSources from '@/environments/simplified/study/results/AllResultsFromEmissionsSources'
import { ChartType } from '@/environments/simplified/study/results/utils'
import { ExportRule, SiteCAUnit } from '@prisma/client'

interface Props {
  emissionFactorsWithParts: EmissionFactorWithParts[]
  study: FullStudy
  validatedOnly: boolean
  chartOrder?: Record<ChartType, number>
  caUnit?: SiteCAUnit
  showSubLevel?: boolean
  rules: ExportRule[]
}

const AllResults = ({
  emissionFactorsWithParts,
  study,
  validatedOnly,
  chartOrder,
  caUnit,
  showSubLevel = false,
  rules,
}: Props) => {
  if (study.simplified) {
    return (
      <AllResultsSimplifiedFromEmissionsSources
        showSubLevel={showSubLevel}
        emissionFactorsWithParts={emissionFactorsWithParts}
        study={study}
        validatedOnly={validatedOnly}
        caUnit={caUnit}
        chartOrder={chartOrder}
      />
    )
  }

  return (
    <AllResultsAdvanced
      study={study}
      rules={rules}
      emissionFactorsWithParts={emissionFactorsWithParts}
      validatedOnly={validatedOnly}
      caUnit={caUnit}
    />
  )
}

export default AllResults
