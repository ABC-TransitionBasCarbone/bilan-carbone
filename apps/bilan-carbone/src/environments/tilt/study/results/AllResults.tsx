import AllResultsAdvanced from '@/components/study/results/AllResults'
import { EmissionFactorWithParts } from '@/db/emissionFactors'
import { FullStudy } from '@/db/study'
import AllResultsPublicodes from '@/environments/simplified/study/results/AllResultsPublicodes'
import { ChartType } from '@/environments/simplified/study/results/utils'
import { ExportRule, SiteCAUnit } from '@repo/db-common'

interface Props {
  emissionFactorsWithParts: EmissionFactorWithParts[]
  study: FullStudy
  validatedOnly: boolean
  chartOrder?: Record<ChartType, number>
  caUnit?: SiteCAUnit
  showSubLevel?: boolean
  rules: ExportRule[]
}

const AllResults = ({ emissionFactorsWithParts, study, validatedOnly, caUnit, rules, chartOrder }: Props) => {
  if (study.simplified) {
    return <AllResultsPublicodes study={study} caUnit={caUnit} chartOrder={chartOrder} />
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
