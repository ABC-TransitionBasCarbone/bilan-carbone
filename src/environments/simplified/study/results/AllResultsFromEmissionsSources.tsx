'use client'

import useStudySite from '@/components/study/site/useStudySite'
import { FullStudy } from '@/db/study'
import { useTranslations } from 'next-intl'
import { useMemo } from 'react'

import { SiteCAUnit } from '@prisma/client'

import { Post } from '@/services/posts'
import { BaseResultsByPost, BaseResultsBySite } from '@/services/results/consolidated'
import { getDetailedEmissionResults } from '@/services/study'
import { STUDY_UNIT_VALUES } from '@/utils/study'
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

  // Compute results for all sites once (not dependent on studySite)
  const computedResultsBySite: BaseResultsBySite = useMemo(() => {
    const siteIds = study.sites.map((s) => s.id)
    const bySite: Record<string, BaseResultsByPost[]> = {}

    for (const siteId of siteIds) {
      const { computedResultsWithDep: siteResults } = getDetailedEmissionResults(
        study,
        tPost,
        siteId,
        !!validatedOnly,
        study.organizationVersion.environment,
        tResults,
      )
      bySite[siteId] = siteResults
    }

    // Aggregated results for "all sites"
    const { computedResultsWithDep: aggregatedResults } = getDetailedEmissionResults(
      study,
      tPost,
      'all',
      !!validatedOnly,
      study.organizationVersion.environment,
      tResults,
    )

    return { aggregated: aggregatedResults, bySite }
  }, [study, tPost, validatedOnly, tResults])

  // Select results for the current site from precomputed results
  const { selectedResults, totalValue } = useMemo(() => {
    const results =
      studySite === 'all' ? computedResultsBySite.aggregated : (computedResultsBySite.bySite[studySite] ?? [])
    const total = results.find((r) => r.post === 'total')?.value ?? 0
    return {
      selectedResults: results,
      totalValue: total / STUDY_UNIT_VALUES[study.resultsUnit],
    }
  }, [computedResultsBySite, studySite, study.resultsUnit])

  return (
    <AllResults
      study={study}
      computedResults={selectedResults}
      computedResultsBySite={computedResultsBySite}
      totalValue={totalValue}
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
