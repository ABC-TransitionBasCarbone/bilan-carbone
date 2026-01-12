'use client'

import useStudySite from '@/components/study/site/useStudySite'
import { FullStudy } from '@/db/study'
import { useTranslations } from 'next-intl'
import { useMemo } from 'react'

import { SiteCAUnit } from '@prisma/client'

import { Post } from '@/services/posts'
import { getDetailedEmissionResults } from '@/services/study'
import AllResults from './AllResults'
import { ChartType, defaultChartOrder } from './utils'

interface Props {
  study: FullStudy
  validatedOnly: boolean
  chartOrder?: Record<ChartType, number>
  caUnit?: SiteCAUnit
  showSubLevel?: boolean
  customPostOrder?: Post[]
}

const AllResultsFromEmissionsSources = ({
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
    <AllResults
      study={study}
      computedResults={computedResultsWithDep}
      totalValue={withDepValue}
      studySite={studySite}
      setSite={setSite}
      chartOrder={chartOrder}
      caUnit={caUnit}
      showSubLevel={showSubLevel}
      customPostOrder={customPostOrder}
      hiddenUncertainty={true}
    />
  )
}

export default AllResultsFromEmissionsSources
