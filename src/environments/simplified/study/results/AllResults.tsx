'use client'

import useStudySite from '@/components/study/site/useStudySite'
import { FullStudy } from '@/db/study'
import { useTranslations } from 'next-intl'
import { useMemo } from 'react'

import { EmissionFactorWithParts } from '@/db/emissionFactors'
import { SiteCAUnit } from '@prisma/client'

import Block from '@/components/base/Block'
import LoadingButton from '@/components/base/LoadingButton'
import BarChart from '@/components/study/charts/BarChart'
import PieChart from '@/components/study/charts/PieChart'
import { useServerFunction } from '@/hooks/useServerFunction'
import { generateStudySummaryPDF } from '@/services/serverFunctions/pdf'
import classNames from 'classnames'
import Link from 'next/link'
import styles from './AllResults.module.css'

import EmissionsAnalysisClickson from '@/environments/clickson/study/results/consolidated/EmissionsAnalysisClickson'
import { Post } from '@/services/posts'
import { useAppEnvironmentStore } from '@/store/AppEnvironment'
import {
  hasAccessToSimplifiedEmissionAnalysis,
  showResultsInfoText,
} from '../../../../services/permissions/environment'

interface Props {
  emissionFactorsWithParts: EmissionFactorWithParts[]
  study: FullStudy
  validatedOnly: boolean
  chartOrder?: Record<ChartType, number>
  caUnit?: SiteCAUnit
  showSubLevel?: boolean
}

const a11yProps = (index: number) => {
  return {
    id: `full-width-tab-${index}`,
    'aria-controls': `full-width-tabpanel-${index}`,
  }
}

export type ChartType = 'pie' | 'bar' | 'table'

const defaultChartOrder: Record<ChartType, number> = {
  table: 0,
  bar: 1,
  pie: 2,
}

const tabsLabels = [
  { key: 'table', label: 'Tableau' },
  { key: 'bar', label: 'Diagramme en barres' },
  { key: 'pie', label: 'Diagramme circulaire' },
]

const AllResults = ({
  emissionFactorsWithParts,
  study,
  validatedOnly,
  chartOrder = defaultChartOrder,
  caUnit = SiteCAUnit.K,
  showSubLevel = false,
}: Props) => {
  const tPost = useTranslations('emissionFactors.post')
  const tResults = useTranslations('study.results')

  const { studySite, setSite } = useStudySite(study, true)

  const handlePDFDownload = async () => {
    setPdfLoading(true)
    await callServerFunction(() => generateStudySummaryPDF(study.id, study.name, study.startDate.getFullYear()), {
      onSuccess: (data) => {
        const pdfBuffer = new Uint8Array(data.pdfBuffer)
        const pdfBlob = new Blob([pdfBuffer], { type: data.contentType })

        const url = URL.createObjectURL(pdfBlob)
        const link = document.createElement('a')
        link.href = url
        link.download = data.filename
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)
      },
    })
    setPdfLoading(false)
  }

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

  const filteredTabsLabels = useMemo(() => {
    return tabsLabels.filter((tab) => tab !== 'ratio' || (environment && hasAccessToResultsRatioTab(environment)))
  }, [environment])

  const orderedTabs = [...filteredTabsLabels].sort((a, b) => chartOrder[a as ChartType] - chartOrder[b as ChartType])

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
