import { UserSessionProps } from '@/components/hoc/withAuth'
import AllResultsAdvanced from '@/components/study/results/AllResults'
import { EmissionFactorWithParts } from '@/db/emissionFactors'
import type { FullStudy } from '@/db/study'
import AllResultsPublicodes from '@/environments/simplified/study/results/AllResultsPublicodes'
import { ChartType } from '@/environments/simplified/study/results/utils'
import { ExportRule, SiteCAUnit } from '@abc-transitionbascarbone/db-common'
import { UserSession } from 'next-auth'

interface Props {
  emissionFactorsWithParts: EmissionFactorWithParts[]
  study: FullStudy
  validatedOnly: boolean
  chartOrder?: Record<ChartType, number>
  caUnit?: SiteCAUnit
  showSubLevel?: boolean
  rules: ExportRule[]
  user: UserSession
}

const AllResults = ({ emissionFactorsWithParts, study, validatedOnly, caUnit, rules, chartOrder, user }: Props) => {
  if (study.simplified) {
    return <AllResultsPublicodes study={study} caUnit={caUnit} chartOrder={chartOrder} user={user} />
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
