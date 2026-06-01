'use client'

import Block from '@/components/base/Block'
import LoadingButton from '@/components/base/LoadingButton'
import BarChart from '@/components/study/charts/BarChart'
import PieChart from '@/components/study/charts/PieChart'
import CarbonIntensities from '@/components/study/results/consolidated/CarbonIntensities'
import ConsolidatedResultsTable from '@/components/study/results/consolidated/ConsolidatedResultsTable'
import SelectStudySite from '@/components/study/site/SelectStudySite'
import TabPanel from '@/components/tabPanel/tabPanel'
import { EmissionFactorWithParts } from '@/db/emissionFactors'
import type { FullStudy } from '@/db/study'
import EmissionsAnalysisClickson from '@/environments/clickson/study/results/consolidated/EmissionsAnalysisClickson'
import CarbonIntensitiesCut from '@/environments/cut/study/results/CarbonIntensitiesCut'
import SheetIcon from '@/environments/simplified/icons/SheetIcon'
import { useServerFunction } from '@/hooks/useServerFunction'
import { customRich } from '@/i18n/customRich'
import {
  hasAccessToAdvancedEmissionAnalysis,
  hasAccessToFeedbackButton,
  hasAccessToPDFExport,
  hasAccessToResultsRatioTab,
  hasAccessToSimplifiedEmissionAnalysis,
  isClickson,
  showResultsInfoText,
} from '@/services/permissions/environment'
import type { BaseResultsByPost } from '@/services/posts'
import { generateStudySummaryPDF } from '@/services/serverFunctions/pdf'
import { downloadStudyResults } from '@/services/study'
import { useAppEnvironmentStore } from '@/store/AppEnvironment'
import type { BaseResultsBySite } from '@/types/study.types'
import { SiteCAUnit } from '@abc-transitionbascarbone/db-common/enums'
import DownloadIcon from '@mui/icons-material/Download'
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf'
import { Box, Button, Tab, Tabs, Typography } from '@mui/material'
import classNames from 'classnames'
import { UserSession } from 'next-auth'
import { useTranslations } from 'next-intl'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { SyntheticEvent, useMemo, useState } from 'react'
import styles from './AllResults.module.css'
import { a11yProps, ChartType, defaultChartOrder, tabsLabels } from './utils'

const FeedbackModal = dynamic(() => import('./FeedbackModal'))

interface Props {
  setSite: (site: string) => void
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
  user?: UserSession
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
  user,
}: Props) => {
  const [tabValue, setTabValue] = useState(0)
  const [pdfLoading, setPdfLoading] = useState(false)
  const [openFeedback, setOpenFeedback] = useState(false)
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
          {environment && hasAccessToFeedbackButton(environment) && (
            <Button variant="outlined" color="primary" size="large" onClick={() => setOpenFeedback(true)}>
              {tResults('feedback.button')}
            </Button>
          )}
          <Button
            variant="contained"
            color="primary"
            size="large"
            endIcon={environment && isClickson(environment) ? <SheetIcon /> : <DownloadIcon />}
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
                study.organizationVersion.environment,
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
          {environment && hasAccessToFeedbackButton(environment) && user && openFeedback && (
            <FeedbackModal
              user={user}
              organizationName={study.organizationVersion.organization.name}
              open={openFeedback}
              setOpen={setOpenFeedback}
            />
          )}
        </Box>
      </Box>
    </Block>
  )
}

export default AllResults
