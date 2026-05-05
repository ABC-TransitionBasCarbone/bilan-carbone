'use client'

import Block from '@/components/base/Block'
import Box from '@/components/base/Box'
import useStudySite from '@/components/study/site/useStudySite'
import type { FullStudy } from '@/db/study'
import { usePublicodesResults } from '@/hooks/usePublicodesResults'
import { getTotalValueFromBaseResults } from '@/services/results/publicodes'
import { SiteCAUnit } from '@abc-transitionbascarbone/db-common/enums'
import CircularProgress from '@mui/material/CircularProgress'
import { useTranslations } from 'next-intl'
import { useMemo } from 'react'
import AllResults from './AllResults'
import { ChartType, defaultChartOrder } from './utils'

interface Props {
  study: FullStudy
  chartOrder?: Record<ChartType, number>
  caUnit?: SiteCAUnit
  showSubLevel?: boolean
}

const AllResultsPublicodes = ({ study, chartOrder = defaultChartOrder, caUnit, showSubLevel = false }: Props) => {
  const tStudyNav = useTranslations('study.navigation')
  const { siteId, studySiteId, setSite } = useStudySite(study, true)
  const { aggregated, bySite, isLoading, error } = usePublicodesResults(
    study,
    'all',
    study.organizationVersion.environment,
  )

  // NOTE: results for all sites are computed one time, so we just need to
  // select the right one here based on the selected study site. However,
  // if the site's situation is updated in the database, the results won't
  // be updated here until a full re-computation is done (e.g., by refreshing
  // the page). I assume that it's acceptable for now.
  const selectedResults = useMemo(() => {
    if (siteId === 'all') {
      return aggregated
    }
    return bySite[studySiteId] ?? []
  }, [aggregated, bySite, siteId, studySiteId])

  const totalValue = useMemo(
    () => getTotalValueFromBaseResults(selectedResults, study.resultsUnit),
    [selectedResults, study.resultsUnit],
  )

  if (isLoading || error) {
    return (
      <Block title={study.name} as="h2" description={tStudyNav('results')} bold descriptionColor="primary">
        <Box display="flex" justifyContent="center" alignItems="center" minHeight={200}>
          {error ? <p>{error}</p> : <CircularProgress />}
        </Box>
      </Block>
    )
  }

  return (
    <AllResults
      study={study}
      computedResults={selectedResults}
      computedResultsBySite={{
        aggregated,
        bySite,
      }}
      totalValue={totalValue}
      studySite={siteId}
      setSite={setSite}
      chartOrder={chartOrder}
      caUnit={caUnit}
      showSubLevel={showSubLevel}
    />
  )
}

export default AllResultsPublicodes
