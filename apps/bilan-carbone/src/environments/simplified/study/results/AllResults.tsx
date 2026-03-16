'use client'

import SelectStudySite from '@/components/study/site/SelectStudySite'
import { FullStudy } from '@/db/study'
import DownloadIcon from '@mui/icons-material/Download'
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf'
import { Box, Button, Tab, Tabs, Typography } from '@mui/material'
import { useTranslations } from 'next-intl'
import { Dispatch, SetStateAction, SyntheticEvent, useMemo, useState } from 'react'

import ConsolidatedResultsTable from '@/components/study/results/consolidated/ConsolidatedResultsTable'
import TabPanel from '@/components/tabPanel/tabPanel'
import { downloadStudyResults } from '@/services/study'
import { Environment, SiteCAUnit } from '@prisma/client'

import Block from '@/components/base/Block'
import LoadingButton from '@/components/base/LoadingButton'
import BarChart from '@/components/study/charts/BarChart'
import PieChart from '@/components/study/charts/PieChart'
import { useServerFunction } from '@/hooks/useServerFunction'
import { generateStudySummaryPDF } from '@/services/serverFunctions/pdf'
import classNames from 'classnames'
import Link from 'next/link'
import styles from './AllResults.module.css'

import CarbonIntensities from '@/components/study/results/consolidated/CarbonIntensities'
import { EmissionFactorWithParts } from '@/db/emissionFactors'
import EmissionsAnalysisClickson from '@/environments/clickson/study/results/consolidated/EmissionsAnalysisClickson'
import CarbonIntensitiesCut from '@/environments/cut/study/results/CarbonIntensitiesCut'
import { customRich } from '@/i18n/customRich'
import {
  hasAccessToAdvancedEmissionAnalysis,
  hasAccessToPDFExport,
  hasAccessToResultsRatioTab,
  hasAccessToSimplifiedEmissionAnalysis,
  showResultsInfoText,
} from '@/services/permissions/environment'
import { BaseResultsByPost, BaseResultsBySite } from '@/services/results/consolidated'
import { useAppEnvironmentStore } from '@/store/AppEnvironment'
import { a11yProps, ChartType, defaultChartOrder, tabsLabels } from './utils'

interface Props {
  setSite: Dispatch<SetStateAction<string>>
  study: FullStudy
  studySite: string
  // equivalent to previous `withDepValue`
  totalValue: number
  computedResults: BaseResultsByPost[]
  computedResultsBySite?: BaseResultsBySite
  totalValueWithoutDep?: number
  caUnit?: SiteCAUnit
  chartOrder?: Record<ChartType, number>
  emissionFactorsWithPart?: EmissionFactorWithParts[]
  showSubLevel?: boolean
}

const AllResults = ({
  setSite,
  study,
  studySite,
  totalValue,
  computedResults,
  computedResultsBySite,
  totalValueWithoutDep = totalValue,
  caUnit = SiteCAUnit.K,
  chartOrder = defaultChartOrder,
  emissionFactorsWithPart = [],
  showSubLevel = false,
}: Props) => {
  const [tabValue, setTabValue] = useState(0)
  const [pdfLoading, setPdfLoading] = useState(false)

  const { environment } = useAppEnvironmentStore()

  const handleChange = (_event: SyntheticEvent, newValue: number) => {
    setTabValue(newValue)
  }

  const tOrga = useTranslations('study.organization')
  const tPost = useTranslations('emissionFactors.post')
  const tResults = useTranslations('study.results')
  const tExport = useTranslations('exports')
  const tQuality = useTranslations('quality')
  const tBeges = useTranslations('beges')
  const tGHGP = useTranslations('ghgp')
  const tUnits = useTranslations('study.results.units')
  const tExportButton = useTranslations('study.export')
  const tStudyNav = useTranslations('study.navigation')
  const tBase = useTranslations('emissionFactors.base')

  const { callServerFunction } = useServerFunction()

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

  const filteredTabsLabels = useMemo(() => {
    return tabsLabels.filter((tab) => tab !== 'ratio' || (environment && hasAccessToResultsRatioTab(environment)))
  }, [environment])

  const orderedTabs = [...filteredTabsLabels].sort((a, b) => chartOrder[a as ChartType] - chartOrder[b as ChartType])

  return (
    <Block
      title={study.name}
      as="h2"
      description={tStudyNav('results')}
      bold
      descriptionColor="primary"
      rightComponent={
        <div className="flex gapped align-center">
          <Button
            variant="contained"
            color="primary"
            size="large"
            endIcon={<DownloadIcon />}
            onClick={() =>
              downloadStudyResults(
                study,
                [],
                [],
                emissionFactorsWithPart,
                tResults,
                tExport,
                tPost,
                tOrga,
                tQuality,
                tBeges,
                tGHGP,
                tUnits,
                tBase,
                Environment.CUT,
                computedResultsBySite,
              )
            }
          >
            {tExportButton('export')}
          </Button>
          {environment && hasAccessToPDFExport(environment) && (
            <LoadingButton
              variant="outlined"
              color="primary"
              size="large"
              endIcon={<PictureAsPdfIcon />}
              onClick={handlePDFDownload}
              loading={pdfLoading}
            >
              {pdfLoading ? tResults('downloadingPDF') : tResults('downloadPDF')}
            </LoadingButton>
          )}
          <SelectStudySite sites={study.sites} defaultValue={studySite} setSite={setSite} />
        </div>
      }
    >
      {/* Default info text for environments that show it */}
      {environment && showResultsInfoText(environment) && (
        <>
          <Box component="section" className="mb2">
            <Typography>
              {customRich(tResults, 'simplifiedFeedback', {
                questionnaire: (children) => (
                  <Link href={process.env.NEXT_PUBLIC_CUT_FEEDBACK_TYPEFORM_LINK ?? ''} target="_blank">
                    <strong>{children}</strong>
                  </Link>
                ),
              })}
            </Typography>
          </Box>
          <Box component="section">
            <Typography className={classNames(styles.infoContainer)}>
              {customRich(tResults, 'infoWithLinks', {
                formation: (children) => (
                  <Link href={process.env.NEXT_PUBLIC_FORMATION_URL ?? ''} target="_blank">
                    <strong>{children}</strong>
                  </Link>
                ),
                email: (children) => (
                  <Link href={`mailto:${process.env.NEXT_PUBLIC_CUT_SUPPORT_EMAIL ?? ''}`} target="_blank">
                    <strong>{children}</strong>
                  </Link>
                ),
                prestataire: (children) => (
                  <Link href={process.env.NEXT_PUBLIC_ACTORS_URL ?? ''} target="_blank">
                    <strong>{children}</strong>
                  </Link>
                ),
              })}
            </Typography>
          </Box>
        </>
      )}

      {/* Emissions analysis for environments that have it */}
      {environment && hasAccessToSimplifiedEmissionAnalysis(environment) ? (
        <EmissionsAnalysisClickson study={study} studySite={studySite} totalValue={totalValue} />
      ) : null}

      {environment && hasAccessToAdvancedEmissionAnalysis(environment) ? (
        <CarbonIntensities
          study={study}
          studySite={studySite}
          withDep={totalValue}
          withoutDep={totalValueWithoutDep}
          caUnit={caUnit}
        />
      ) : null}

      {/* Results tabs */}
      <Box component="section" sx={{ marginTop: '1rem' }}>
        <Tabs
          value={tabValue}
          onChange={handleChange}
          indicatorColor="secondary"
          textColor="inherit"
          variant="fullWidth"
        >
          {orderedTabs.map((tab, index) => (
            <Tab key={tab} label={tResults(`chartTypes.${tab}`)} {...a11yProps(index)} />
          ))}
        </Tabs>
        <Box component="section" sx={{ marginTop: '1rem' }}>
          <TabPanel value={tabValue} index={chartOrder.table}>
            <ConsolidatedResultsTable resultsUnit={study.resultsUnit} data={computedResults} hiddenUncertainty />
          </TabPanel>
          <TabPanel value={tabValue} index={chartOrder.bar}>
            <BarChart
              results={computedResults}
              resultsUnit={study.resultsUnit}
              height={400}
              showTitle={false}
              showLegend={true}
              showSubLevel={showSubLevel}
              showLabelsOnBars={!showSubLevel}
              type="post"
            />
          </TabPanel>
          <TabPanel value={tabValue} index={chartOrder.pie}>
            <PieChart
              resultsUnit={study.resultsUnit}
              height={400}
              showTitle={false}
              showLabelsOnPie={true}
              results={computedResults}
              showSubLevel={false}
              type="post"
            />
          </TabPanel>
          {environment && hasAccessToResultsRatioTab(environment) ? (
            <TabPanel value={tabValue} index={chartOrder.ratio}>
              <CarbonIntensitiesCut study={study} studySite={studySite} withDepValue={totalValue} />
            </TabPanel>
          ) : null}
        </Box>
      </Box>
    </Block>
  )
}

export default AllResults
