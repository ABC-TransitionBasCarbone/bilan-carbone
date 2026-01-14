'use client'

import useStudySite from '@/components/study/site/useStudySite'
import { EmissionFactorWithParts } from '@/db/emissionFactors'
import { FullStudy } from '@/db/study'
import { getDetailedEmissionResults } from '@/services/study'
import { SiteCAUnit } from '@prisma/client'
import { useTranslations } from 'next-intl'
import { useMemo } from 'react'
import AllResults from './AllResults'
import { ChartType, defaultChartOrder } from './utils'

interface Props {
  emissionFactorsWithParts: EmissionFactorWithParts[]
  study: FullStudy
  validatedOnly: boolean
  chartOrder?: Record<ChartType, number>
  caUnit?: SiteCAUnit
  showSubLevel?: boolean
}

const AllResultsFromEmissionsSources = ({
  emissionFactorsWithParts,
  study,
  validatedOnly,
  chartOrder = defaultChartOrder,
  caUnit,
  showSubLevel = false,
}: Props) => {
  const tPost = useTranslations('emissionFactors.post')
  const tResults = useTranslations('study.results')

  const { studySite, setSite } = useStudySite(study, true)

  const { computedResultsWithDep, withDepValue, withoutDepValue } = useMemo(
    () =>
      getDetailedEmissionResults(
        study,
        tPost,
        studySite,
        !!validatedOnly,
        study.organizationVersion.environment,
        tResults,
      ),
    [study, studySite, tPost, tResults, validatedOnly],
  )

  return (
    <AllResults
      study={study}
      computedResults={computedResultsWithDep}
      totalValue={withDepValue}
      totalValueWithoutDep={withoutDepValue}
      studySite={studySite}
      setSite={setSite}
      chartOrder={chartOrder}
      caUnit={caUnit}
      emissionFactorsWithPart={emissionFactorsWithParts}
      showSubLevel={showSubLevel}
    />
  )
}

export default AllResultsFromEmissionsSources
