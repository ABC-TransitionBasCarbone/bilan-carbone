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

  const studySiteIds = useMemo(
    () => (studySite === 'all' ? study.sites.map((s) => s.id) : [studySite]),
    [studySite, study.sites],
  )

  const { results, isLoading, error } = usePublicodesResults(
    study.id,
    studySiteIds,
    study.organizationVersion.environment,
  )

  const totalValue = useMemo(() => {
    const total = results.find((r) => r.post === 'total')?.value ?? 0
    return total / STUDY_UNIT_VALUES[study.resultsUnit]
  }, [results, study.resultsUnit])

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
      computedResults={results}
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
