'use client'

import SelectStudySite from '@/components/study/site/SelectStudySite'
import useStudySite from '@/components/study/site/useStudySite'
import { FullStudy } from '@/db/study'
import { computeResultsByPost } from '@/services/results/consolidated'
import DownloadIcon from '@mui/icons-material/Download'
import { Box, Button, CircularProgress, Container, Tab, Tabs, Typography, useTheme } from '@mui/material'
import { BarChart, PieChart } from '@mui/x-charts'
import { useTranslations } from 'next-intl'
import { SyntheticEvent, useEffect, useMemo, useState } from 'react'

import ConsolidatedResultsTable from '@/components/study/results/consolidated/ConsolidatedResultsTable'
import TabPanel from '@/components/tabPanel/tabPanel'
import { EmissionFactorWithParts } from '@/db/emissionFactors'
import { useChartData, useComputedResults } from '@/hooks/useComputedResults'
import { useListPosts } from '@/hooks/useListPosts'
import { CutPost } from '@/services/posts'
import { downloadStudyResults } from '@/services/study'
import { STUDY_UNIT_VALUES } from '@/utils/study'
import { axisClasses } from '@mui/x-charts/ChartsAxis'

import { formatNumber } from '@/utils/number'
import { Environment } from '@prisma/client'
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

const CircularProgressCenter = ({ message }: { message: string }) => {
  return (
    <Box className={styles.circularContainer}>
      <CircularProgress variant="indeterminate" color="primary" />
      <Typography>{message}</Typography>
    </Box>
  )
}

const AllResults = ({ emissionFactorsWithParts, study, validatedOnly }: Props) => {
  const theme = useTheme()
  const [loading, setLoading] = useState<boolean>(true)
  const [value, setValue] = useState(0)
  const handleChange = (_event: SyntheticEvent, newValue: number) => {
    setValue(newValue)
  }
  const t = useTranslations('study.results')
  const tOrga = useTranslations('study.organization')
  const tPost = useTranslations('emissionFactors.post')
  const tExport = useTranslations('exports')
  const tQuality = useTranslations('quality')
  const tBeges = useTranslations('beges')
  const tUnits = useTranslations('study.results.units')
  const tExportButton = useTranslations('study.export')

  const { studySite, setSite } = useStudySite(study, true)

  const resultsByPost = useMemo(
    () => computeResultsByPost(study, tPost, studySite, true, validatedOnly),
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

  const chartFormatter = (value: number | null) => {
    const safeValue = value ?? 0
    const unit = study.resultsUnit
    const precision = unit === 'K' ? 3 : 0
    return `${formatNumber(safeValue / STUDY_UNIT_VALUES[unit], precision)} ${tUnits(unit)}`
  }

  useEffect(() => {
    setLoading(true)

    const timeout = setTimeout(() => {
      setLoading(false)
    }, 2000)

    return () => clearTimeout(timeout)
  }, [resultsByPost])

  return (
    <Container>
      <Box component="section" sx={{ display: 'flex', gap: '1rem' }}>
        <SelectStudySite study={study} allowAll studySite={studySite} setSite={setSite} />
        <Button
          variant="outlined"
          size="large"
          endIcon={<DownloadIcon />}
          onClick={() =>
            downloadStudyResults(
              study,
              [],
              emissionFactorsWithParts,
              t,
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
      </Box>
      <Box component="section" sx={{ marginTop: '1rem' }}>
        <Tabs value={value} onChange={handleChange} indicatorColor="secondary" textColor="inherit" variant="fullWidth">
          <Tab label="Tableau" {...a11yProps(0)} />
          <Tab label="Diagramme en barres" {...a11yProps(1)} />
          <Tab label="Diagramme circulaire" {...a11yProps(2)} />
        </Tabs>
        <Box component="section" sx={{ marginTop: '1rem' }}>
          <TabPanel value={value} index={0}>
            <ConsolidatedResultsTable study={study} studySite={studySite} withDependencies={false} />
          </TabPanel>
          {resultsByPost.length !== 0 && (
            <>
              <TabPanel value={value} index={1}>
                {loading ? (
                  <CircularProgressCenter message={t('loading')} />
                ) : barData.values.length !== 0 ? (
                  <BarChart
                    xAxis={[
                      {
                        data: barData.labels,
                        height: 80,
                        scaleType: 'band',
                        tickLabelStyle: { angle: -20, textAnchor: 'end' },
                        tickPlacement: 'extremities',
                        tickLabelPlacement: 'middle',
                      },
                    ]}
                    series={[
                      { color: theme.palette.primary.main, data: barData.values, valueFormatter: chartFormatter },
                    ]}
                    grid={{ horizontal: true }}
                    yAxis={[{ label: tUnits(study.resultsUnit) }]}
                    axisHighlight={{ x: 'none' }}
                    {...barChartSettings}
                  />
                ) : (
                  <Typography align="center" sx={{ mt: '0.25rem' }}>
                    {t('no-data')}
                  </Typography>
                )}
              </TabPanel>
              <TabPanel value={value} index={2}>
                {loading ? (
                  <CircularProgressCenter message={t('loading')} />
                ) : pieData.length !== 0 ? (
                  <PieChart
                    series={[{ data: pieData, valueFormatter: ({ value }) => chartFormatter(value) }]}
                    height={350}
                  />
                ) : (
                  <Typography align="center" sx={{ mt: '0.25rem' }}>
                    {t('no-data')}
                  </Typography>
                )}
              </TabPanel>
            </>
          )}
        </Box>
      </Box>
    </Container>
  )
}

export default AllResults
