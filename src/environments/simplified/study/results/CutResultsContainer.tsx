'use client'

import Block from '@/components/base/Block'
import Box from '@/components/base/Box'
import useStudySite from '@/components/study/site/useStudySite'
import { EmissionFactorWithParts } from '@/db/emissionFactors'
import { FullStudy } from '@/db/study'
import { CutPublicodesSituationProvider, useCutPublicodesSituation } from '@/environments/cut/context/publicodesContext'
import { getPostRuleName, getSubPostRuleName } from '@/environments/cut/publicodes/subPostMapping'
import { CutPost, Post, subPostsByPostCUT } from '@/services/posts'
import { computeBaseResultsByPostFromEngine } from '@/services/results/publicodes'
import { STUDY_UNIT_VALUES } from '@/utils/study'
import CircularProgress from '@mui/material/CircularProgress'
import { SiteCAUnit } from '@prisma/client'
import { useTranslations } from 'next-intl'
import { Dispatch, SetStateAction, useMemo } from 'react'
import AllResultsBase from './AllResultsBase'
import { ChartType, defaultChartOrder } from './utils'

interface CutAllResultsProps {
  emissionFactorsWithParts: EmissionFactorWithParts[]
  study: FullStudy
  chartOrder?: Record<ChartType, number>
  caUnit?: SiteCAUnit
  showSubLevel?: boolean
  customPostOrder?: Post[]
  studySite: string
  setSite: Dispatch<SetStateAction<string>>
}

/**
 * Inner component that uses the Publicodes context to compute results.
 * Must be rendered inside CutPublicodesSituationProvider.
 */
const CutAllResults = ({
  emissionFactorsWithParts,
  study,
  chartOrder = defaultChartOrder,
  caUnit,
  showSubLevel = false,
  customPostOrder = [],
  studySite,
  setSite,
}: CutAllResultsProps) => {
  const tPost = useTranslations('emissionFactors.post')
  const tStudyNav = useTranslations('study.navigation')
  const { engine, situation, isLoading } = useCutPublicodesSituation()

  const { computedResults, totalValue } = useMemo(() => {
    if (!situation) {
      return { computedResults: [], totalValue: 0 }
    }

    const results = computeBaseResultsByPostFromEngine(
      engine,
      Object.values(CutPost),
      subPostsByPostCUT,
      tPost,
      getPostRuleName,
      getSubPostRuleName,
    )

    const total = results.find((r) => r.post === 'total')?.value ?? 0
    const totalInUnit = total / STUDY_UNIT_VALUES[study.resultsUnit]

    return { computedResults: results, totalValue: totalInUnit }
  }, [engine, situation, tPost, study.resultsUnit])

  if (isLoading) {
    return (
      <Block title={study.name} as="h2" description={tStudyNav('results')} bold descriptionColor="primary">
        <Box display="flex" justifyContent="center" alignItems="center" minHeight={200}>
          <CircularProgress />
        </Box>
      </Block>
    )
  }

  return (
    <AllResultsBase
      study={study}
      computedResults={computedResults}
      totalValue={totalValue}
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

interface Props {
  emissionFactorsWithParts: EmissionFactorWithParts[]
  study: FullStudy
  chartOrder?: Record<ChartType, number>
  caUnit?: SiteCAUnit
  showSubLevel?: boolean
  customPostOrder?: Post[]
}

const CutResultsContainer = ({
  emissionFactorsWithParts,
  study,
  chartOrder = defaultChartOrder,
  caUnit,
  showSubLevel = false,
  customPostOrder = [],
}: Props) => {
  const { studySite, setSite } = useStudySite(study, false)

  return (
    <CutPublicodesSituationProvider studyId={study.id} studySiteId={studySite}>
      <CutAllResults
        emissionFactorsWithParts={emissionFactorsWithParts}
        study={study}
        chartOrder={chartOrder}
        caUnit={caUnit}
        showSubLevel={showSubLevel}
        customPostOrder={customPostOrder}
        studySite={studySite}
        setSite={setSite}
      />
    </CutPublicodesSituationProvider>
  )
}

export default CutResultsContainer
