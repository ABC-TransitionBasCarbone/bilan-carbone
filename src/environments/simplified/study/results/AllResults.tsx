'use client'

import SelectStudySite from '@/components/study/site/SelectStudySite'
import useStudySite from '@/components/study/site/useStudySite'
import { FullStudy } from '@/db/study'
import DownloadIcon from '@mui/icons-material/Download'
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf'
import { Box, Button, Tab, Tabs, Typography } from '@mui/material'
import { useTranslations } from 'next-intl'
import { SyntheticEvent, useMemo, useState } from 'react'

import ConsolidatedResultsTable from '@/components/study/results/consolidated/ConsolidatedResultsTable'
import TabPanel from '@/components/tabPanel/tabPanel'
import { EmissionFactorWithParts } from '@/db/emissionFactors'
import { downloadStudyResults, getDetailedEmissionResults } from '@/services/study'
import { Environment } from '@prisma/client'

import Block from '@/components/base/Block'
import LoadingButton from '@/components/base/LoadingButton'
import BarChart from '@/components/study/charts/BarChart'
import PieChart from '@/components/study/charts/PieChart'
import { useServerFunction } from '@/hooks/useServerFunction'
import { generateStudySummaryPDF } from '@/services/serverFunctions/pdf'
import classNames from 'classnames'
import Link from 'next/link'
import styles from './AllResults.module.css'

import { useAppEnvironmentStore } from '@/store/AppEnvironment'
import { showResultsInfoText } from '../../../../services/permissions/environment'

interface Props {
  emissionFactorsWithParts: EmissionFactorWithParts[]
  study: FullStudy
  validatedOnly: boolean
  chartOrder?: Record<ChartType, number>
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

const AllResults = ({ emissionFactorsWithParts, study, validatedOnly, chartOrder = defaultChartOrder }: Props) => {
  const [value, setValue] = useState(0)
  const [pdfLoading, setPdfLoading] = useState(false)

  const { environment } = useAppEnvironmentStore()

  const handleChange = (_event: SyntheticEvent, newValue: number) => {
    setValue(newValue)
  }
  const tOrga = useTranslations('study.organization')
  const tPost = useTranslations('emissionFactors.post')
  const tResults = useTranslations('study.results')
  const tExport = useTranslations('exports')
  const tQuality = useTranslations('quality')
  const tBeges = useTranslations('beges')
  const tUnits = useTranslations('study.results.units')
  const tExportButton = useTranslations('study.export')
  const tStudyNav = useTranslations('study.navigation')

  const { callServerFunction } = useServerFunction()

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

  const { computedResultsWithDep } = useMemo(
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

  const orderedTabs = [...tabsLabels].sort((a, b) => chartOrder[a.key as ChartType] - chartOrder[b.key as ChartType])

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
                emissionFactorsWithParts,
                tResults,
                tExport,
                tPost,
                tOrga,
                tQuality,
                tBeges,
                tUnits,
                Environment.CUT,
              )
            }
          >
            {tExportButton('export')}
          </Button>
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
          <SelectStudySite sites={study.sites} defaultValue={studySite} setSite={setSite} />
        </div>
      }
    >
      {environment && showResultsInfoText(environment) && (
        <>
          <Box component="section" className="mb2">
            <Typography>
              {tResults.rich('cutFeedback', {
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
              {tResults.rich('infoWithLinks', {
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
      <Box component="section" sx={{ marginTop: '1rem' }}>
        <Tabs value={value} onChange={handleChange} indicatorColor="secondary" textColor="inherit" variant="fullWidth">
          {orderedTabs.map((t, index) => (
            <Tab key={t.key} label={t.label} {...a11yProps(index)} />
          ))}
        </Tabs>
        <Box component="section" sx={{ marginTop: '1rem' }}>
          <TabPanel value={value} index={chartOrder.table}>
            <ConsolidatedResultsTable resultsUnit={study.resultsUnit} data={computedResultsWithDep} hiddenUncertainty />
          </TabPanel>
          <TabPanel value={value} index={chartOrder.bar}>
            <BarChart
              results={computedResultsWithDep}
              resultsUnit={study.resultsUnit}
              height={400}
              showTitle={false}
              showLegend={true}
              showLabelsOnBars={true}
              type="post"
            />
          </TabPanel>
          <TabPanel value={value} index={chartOrder.pie}>
            <PieChart
              resultsUnit={study.resultsUnit}
              height={400}
              showTitle={false}
              showLabelsOnPie={true}
              results={computedResultsWithDep}
              showSubLevel={false}
              type="post"
            />
          </TabPanel>
        </Box>
      </Box>
    </Block>
  )
}

export default AllResults
