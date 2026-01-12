'use client'

import Block from '@/components/base/Block'
import Box from '@/components/base/Box'
import useStudySite from '@/components/study/site/useStudySite'
import { FullStudy } from '@/db/study'
import { usePublicodesResults } from '@/hooks/usePublicodesResults'
import { Post } from '@/services/posts'
import { STUDY_UNIT_VALUES } from '@/utils/study'
import CircularProgress from '@mui/material/CircularProgress'
import { SiteCAUnit } from '@prisma/client'
import { useTranslations } from 'next-intl'
import { useMemo } from 'react'
import AllResults from './AllResults'
import { ChartType, defaultChartOrder } from './utils'

interface Props {
  study: FullStudy
  chartOrder?: Record<ChartType, number>
  caUnit?: SiteCAUnit
  showSubLevel?: boolean
  customPostOrder?: Post[]
}

const AllResultsPublicodes = ({
  study,
  chartOrder = defaultChartOrder,
  caUnit,
  showSubLevel = false,
  customPostOrder = [],
}: Props) => {
  const tStudyNav = useTranslations('study.navigation')
  const { studySite, setSite } = useStudySite(study, true)
  const allStudySiteIds = useMemo(() => study.sites.map((s) => s.id).toSorted(), [study.sites])

  const { aggregatedResults, resultsBySiteId, isLoading, error } = usePublicodesResults(
    study.id,
    allStudySiteIds,
    study.organizationVersion.environment,
  )

  // NOTE: results for all sites are computed one time, so we just need to
  // select the right one here based on the selected study site. However,
  // if the site's situation is updated in the database, the results won't
  // be updated here until a full re-computation is done (e.g., by refreshing
  // the page). I assume that it's acceptable for now.
  const selectedResults = useMemo(() => {
    if (studySite === 'all') {
      return aggregatedResults
    }
    return resultsBySiteId[studySite] ?? []
  }, [aggregatedResults, resultsBySiteId, studySite])

  const totalValue = useMemo(() => {
    const total = selectedResults.find((r) => r.post === 'total')?.value ?? 0
    return total / STUDY_UNIT_VALUES[study.resultsUnit]
  }, [selectedResults, study.resultsUnit])

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

export default AllResultsPublicodes
