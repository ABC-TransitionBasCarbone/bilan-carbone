'use client'

import useStudySite from '@/components/study/site/useStudySite'
import { FullStudy } from '@/db/study'
import { useTranslations } from 'next-intl'
import { useMemo } from 'react'

import { EmissionFactorWithParts } from '@/db/emissionFactors'
import { SiteCAUnit } from '@prisma/client'

import { Post } from '@/services/posts'
import { getDetailedEmissionResults } from '@/services/study'
import AllResultsBase from './AllResultsBase'
import { ChartType, defaultChartOrder } from './utils'

interface Props {
  emissionFactorsWithParts: EmissionFactorWithParts[]
  study: FullStudy
  validatedOnly: boolean
  chartOrder?: Record<ChartType, number>
  caUnit?: SiteCAUnit
  showSubLevel?: boolean
  customPostOrder?: Post[]
}

/**
 * Container for AllResults that computes results from EmissionSources.
 * Used by simplified environments (CUT, Clickson, Tilt) when not using Publicodes.
 */
const AllResults = ({
  emissionFactorsWithParts,
  study,
  validatedOnly,
  chartOrder = defaultChartOrder,
  caUnit,
  showSubLevel = false,
  customPostOrder = [],
}: Props) => {
  const tPost = useTranslations('emissionFactors.post')
  const tResults = useTranslations('study.results')

  const { studySite, setSite } = useStudySite(study, true)

  const { computedResultsWithDep, withDepValue } = useMemo(
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
    <AllResultsBase
      study={study}
      computedResults={computedResultsWithDep}
      totalValue={withDepValue}
      studySite={studySite}
      setSite={setSite}
      emissionFactorsWithParts={emissionFactorsWithParts}
      chartOrder={chartOrder}
      caUnit={caUnit}
      showSubLevel={showSubLevel}
      customPostOrder={customPostOrder}
      hiddenUncertainty={true}
    />
  )
}

export default AllResults
