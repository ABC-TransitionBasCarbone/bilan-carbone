'use client'

import SelectStudySite from '@/components/study/site/SelectStudySite'
import useStudySite from '@/components/study/site/useStudySite'
import { FullStudy } from '@/db/study'
import { useServerFunction } from '@/hooks/useServerFunction'
import { computeResultsByPost } from '@/services/results/consolidated'
import { generateStudyResultsPDF } from '@/services/serverFunctions/pdf'
import DownloadIcon from '@mui/icons-material/Download'
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf'
import { Box, Button, Tab, Tabs, Typography, useTheme } from '@mui/material'
import { BarChart, PieChart } from '@mui/x-charts'
import { useTranslations } from 'next-intl'
import { SyntheticEvent, useMemo, useRef, useState } from 'react'

import ConsolidatedResultsTable from '@/components/study/results/consolidated/ConsolidatedResultsTable'
import TabPanel from '@/components/tabPanel/tabPanel'
import { EmissionFactorWithParts } from '@/db/emissionFactors'
import { useChartData, useComputedResults } from '@/hooks/useComputedResults'
import { useListPosts } from '@/hooks/useListPosts'
import { CutPost } from '@/services/posts'
import { downloadStudyResults } from '@/services/study'
import { STUDY_UNIT_VALUES } from '@/utils/study'
import { axisClasses } from '@mui/x-charts/ChartsAxis'

import Block from '@/components/base/Block'
import { captureChartAsImage } from '@/utils/chartToImage'
import { formatNumber } from '@/utils/number'
import { Environment } from '@prisma/client'
import classNames from 'classnames'
import Link from 'next/link'
import styles from './AllResults.module.css'

interface Props {
  emissionFactorsWithParts: EmissionFactorWithParts[]
  study: FullStudy
  validatedOnly: boolean
}

const a11yProps = (index: number) => {
  return {
    id: `full-width-tab-${index}`,
    'aria-controls': `full-width-tabpanel-${index}`,
  }
}

const AllResults = ({ emissionFactorsWithParts, study, validatedOnly }: Props) => {
  const theme = useTheme()
  const [value, setValue] = useState(0)
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

  const { studySite, setSite } = useStudySite(study, true)
  const { callServerFunction } = useServerFunction()

  // Chart refs for image capture (hidden charts always rendered)
  const barChartRef = useRef<HTMLDivElement>(null)
  const pieChartRef = useRef<HTMLDivElement>(null)

  const handlePDFDownload = async () => {
    try {
      // Wait longer to ensure charts are fully rendered
      await new Promise((resolve) => setTimeout(resolve, 2000))

      // Debug: Check if refs are available
      console.log('Refs status:', {
        barChartRef: !!barChartRef.current,
        pieChartRef: !!pieChartRef.current,
        barChartElement: barChartRef.current,
        pieChartElement: pieChartRef.current,
      })

      // Capture chart images before generating PDF
      const barChartImage = await captureChartAsImage(barChartRef, 500, 300)
      const pieChartImage = await captureChartAsImage(pieChartRef, 500, 300)

      console.log('Chart capture results:', {
        barChart: barChartImage ? 'Success' : 'Failed',
        pieChart: pieChartImage ? 'Success' : 'Failed',
      })

      const chartImages = {
        barChart: barChartImage || undefined,
        pieChart: pieChartImage || undefined,
      }

      const pdfResponse = await callServerFunction(() => generateStudyResultsPDF(study.id, chartImages), {
        getSuccessMessage: () => 'PDF généré avec succès',
        getErrorMessage: () => 'Erreur lors de la génération du PDF',
      })

      if (pdfResponse && pdfResponse.success && pdfResponse.data) {
        // Convert array back to Uint8Array and create blob
        const pdfBuffer = new Uint8Array(pdfResponse.data.pdfBuffer)
        const pdfBlob = new Blob([pdfBuffer], { type: pdfResponse.data.contentType })

        // Download PDF
        const url = URL.createObjectURL(pdfBlob)
        const link = document.createElement('a')
        link.href = url
        link.download = pdfResponse.data.filename
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)
      }
    } catch (error) {
      console.error('Error generating PDF:', error)
    }
  }

  const resultsByPost = useMemo(
    () => computeResultsByPost(study, tPost, studySite, true, validatedOnly, CutPost),
    [study, studySite, tPost, validatedOnly],
  )

  const barChartSettings = {
    height: 450,
    sx: { [`.${axisClasses.left} .${axisClasses.label}`]: { transform: 'translate(-1rem, 0)' } },
    borderRadius: 10,
  }

  const listCutPosts = useListPosts() as CutPost[]
  const computeResults = useComputedResults(resultsByPost, tPost, listCutPosts)

  const { pieData, barData } = useChartData(computeResults, theme)

  // Debug: Log when component renders
  console.log('AllResults render:', {
    resultsByPost: resultsByPost.length,
    barDataLength: barData.values.length,
    pieDataLength: pieData.length,
    barHasNonZero: barData.values.some((v) => v !== 0),
    pieHasData: pieData.length !== 0,
  })

  const chartFormatter = (value: number | null) => {
    const safeValue = value ?? 0
    const unit = study.resultsUnit
    const precision = unit === 'K' ? 3 : 0
    return `${formatNumber(safeValue / STUDY_UNIT_VALUES[unit], precision)} ${tUnits(unit)}`
  }

  return (
    <Block title={study.name} as="h1" description={tStudyNav('results')} bold descriptionColor="primary">
      <Box component="section" className="mb2">
        <Typography>
          {tResults.rich('cutFeedback', {
            lien: (children) => (
              <Link href={process.env.NEXT_PUBLIC_CUT_FEEDBACK_TYPEFORM_LINK ?? ''} target="_blank">
                <strong>{children}</strong>
              </Link>
            ),
          })}
        </Typography>
      </Box>
      <Box component="section" className={classNames(styles.gapped, 'flex')}>
        <div className={classNames(styles.gapped, 'flex flex-col')}>
          <SelectStudySite study={study} allowAll studySite={studySite} setSite={setSite} />
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
          <Button
            variant="outlined"
            color="primary"
            size="large"
            endIcon={<PictureAsPdfIcon />}
            onClick={handlePDFDownload}
          >
            {tResults('downloadPDF')}
          </Button>
        </div>
        <Typography className={classNames(styles.infoContainer, 'ml2')}>{tResults('info')}</Typography>
      </Box>
      <Box component="section" sx={{ marginTop: '1rem' }}>
        <Tabs value={value} onChange={handleChange} indicatorColor="secondary" textColor="inherit" variant="fullWidth">
          <Tab label="Tableau" {...a11yProps(0)} />
          <Tab label="Diagramme en barres" {...a11yProps(1)} />
          <Tab label="Diagramme circulaire" {...a11yProps(2)} />
        </Tabs>
        <Box component="section" sx={{ marginTop: '1rem' }}>
          <TabPanel value={value} index={0}>
            <ConsolidatedResultsTable study={study} studySite={studySite} withDependencies={false} hiddenUncertainty />
          </TabPanel>
          {resultsByPost.length !== 0 && (
            <>
              <TabPanel value={value} index={1}>
                {barData.values.length !== 0 && barData.values.some((v) => v !== 0) ? (
                  <div>
                    <BarChart
                      xAxis={[
                        {
                          data: barData.labels,
                          height: 80,
                          scaleType: 'band',
                          tickLabelStyle: { angle: -20, textAnchor: 'end' },
                          tickPlacement: 'extremities',
                          tickLabelPlacement: 'middle',
                          colorMap: {
                            type: 'ordinal',
                            values: barData.labels,
                            colors: barData.colors,
                          },
                        },
                      ]}
                      series={[{ data: barData.values, valueFormatter: chartFormatter }]}
                      grid={{ horizontal: true }}
                      yAxis={[{ label: tUnits(study.resultsUnit) }]}
                      axisHighlight={{ x: 'none' }}
                      {...barChartSettings}
                    />
                  </div>
                ) : (
                  <Typography align="center" sx={{ mt: '0.25rem' }}>
                    {tResults('noData')}
                  </Typography>
                )}
              </TabPanel>
              <TabPanel value={value} index={2}>
                {pieData.length !== 0 ? (
                  <div>
                    <PieChart
                      series={[{ data: pieData, valueFormatter: ({ value }) => chartFormatter(value) }]}
                      height={350}
                    />
                  </div>
                ) : (
                  <Typography align="center" sx={{ mt: '0.25rem' }}>
                    {tResults('noData')}
                  </Typography>
                )}
              </TabPanel>
            </>
          )}

          {/* Hidden charts for PDF generation - always rendered but invisible */}
          {resultsByPost.length !== 0 && (
            <div
              style={{
                position: 'fixed',
                left: '-9999px',
                top: '-9999px',
                width: '500px',
                height: '300px',
                pointerEvents: 'none',
              }}
            >
              {barData.values.length !== 0 && barData.values.some((v) => v !== 0) && (
                <div ref={barChartRef} style={{ width: '500px', height: '300px' }} data-testid="hidden-bar-chart">
                  <BarChart
                    width={500}
                    height={300}
                    xAxis={[
                      {
                        data: barData.labels,
                        height: 80,
                        scaleType: 'band',
                        tickLabelStyle: { angle: -20, textAnchor: 'end' },
                        tickPlacement: 'extremities',
                        tickLabelPlacement: 'middle',
                        colorMap: {
                          type: 'ordinal',
                          values: barData.labels,
                          colors: barData.colors,
                        },
                      },
                    ]}
                    series={[{ data: barData.values, valueFormatter: chartFormatter }]}
                    grid={{ horizontal: true }}
                    yAxis={[{ label: tUnits(study.resultsUnit) }]}
                    axisHighlight={{ x: 'none' }}
                  />
                </div>
              )}
              {pieData.length !== 0 && (
                <div ref={pieChartRef} style={{ width: '500px', height: '350px' }} data-testid="hidden-pie-chart">
                  <PieChart
                    width={500}
                    height={350}
                    series={[{ data: pieData, valueFormatter: ({ value }) => chartFormatter(value) }]}
                  />
                </div>
              )}
            </div>
          )}
        </Box>
      </Box>
    </Block>
  )
}

export default AllResults
