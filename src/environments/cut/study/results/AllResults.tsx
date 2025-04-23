'use client'

import BegesResultsTable from '@/components/study/results/beges/BegesResultsTable'
import SelectStudySite from '@/components/study/site/SelectStudySite'
import useStudySite from '@/components/study/site/useStudySite'
import { EmissionFactorWithParts } from '@/db/emissionFactors'
import { FullStudy } from '@/db/study'
import { CutPost } from '@/services/posts'
import { computeResultsByPost } from '@/services/results/consolidated'
import { filterWithDependencies } from '@/services/results/utils'
import DownloadIcon from '@mui/icons-material/Download'
import { Box, Button, Container, Tab, Tabs } from '@mui/material'
import { BarChart, PieChart } from '@mui/x-charts'
import { Export, ExportRule, SubPost } from '@prisma/client'
import { useTranslations } from 'next-intl'
import { SyntheticEvent, useMemo, useState } from 'react'

import TabPanel from '@/components/tabPanel/tabPanel'
import { STUDY_UNIT_VALUES } from '@/utils/study'
import { axisClasses } from '@mui/x-charts/ChartsAxis'

interface Props {
  study: FullStudy
  rules: ExportRule[]
  emissionFactorsWithParts: EmissionFactorWithParts[]
  validatedOnly: boolean
}



const a11yProps = (index: number) => {
  return {
    id: `full-width-tab-${index}`,
    'aria-controls': `full-width-tabpanel-${index}`,
  }
}

export default function AllResults({ study, rules, emissionFactorsWithParts, validatedOnly }: Props) {
  const [value, setValue] = useState(0)
  const handleChange = (_event: SyntheticEvent, newValue: number) => {
    setValue(newValue)
  }
  const tPost = useTranslations('emissionFactors.post')
  const tUnits = useTranslations('study.results.units')

  const { studySite, setSite } = useStudySite(study, true)

  const resultsByPost = useMemo(
    () => computeResultsByPost(study, tPost, studySite, true, validatedOnly),
    [study, studySite, tPost, validatedOnly],
  )

  const barChartSettings = {
    height: 300,
    sx: {
      marginLeft: '6rem',
      [`.${axisClasses.left} .${axisClasses.label}`]: {
        transform: 'translate(-32px, 0)',
      },
    },
    borderRadius: 10,
  }

  const computeResults = useMemo(() => {
    const validCutPosts = new Set(Object.values(CutPost))

    return resultsByPost
      .map((post) => ({
        ...post,
        subPosts: post.subPosts.filter((subPost) => filterWithDependencies(subPost.post as SubPost, false)),
      }))
      .map((post) => ({
        ...post,
        value: post.subPosts.reduce((res, subPost) => res + subPost.value, 0),
      }))
      .filter((post) => validCutPosts.has(post.post as CutPost))
      .map(({ post, ...rest }) => ({
        ...rest,
        label: tPost(post),
      }))
  }, [resultsByPost, tPost])

  const pieData = useMemo(() => {
    return computeResults.map(({ label, value }) => ({ label, value: value / STUDY_UNIT_VALUES[study.resultsUnit] })).filter((computeResult) => computeResult.value > 0)
  }, [computeResults])

  const barData = useMemo(() => {
    const values = computeResults.map(({ value }) => value)
    const labels = computeResults.map(({ label }) => label)
    return { values, labels }
  }, [computeResults, study.resultsUnit])

  const begesRules = useMemo(() => rules.filter((rule) => rule.export === Export.Beges), [rules])

  return (
    <Container>
      <Box component="section" sx={{ display: 'flex', gap: '1rem' }}>
        <SelectStudySite study={study} allowAll studySite={studySite} setSite={setSite} />
        <Button variant="outlined" size="large" endIcon={<DownloadIcon />}>
          exporter mon Bilan Carbone
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
            <BegesResultsTable
              study={study}
              rules={begesRules}
              emissionFactorsWithParts={emissionFactorsWithParts}
              studySite={studySite}
              withDependencies={false}
            />
          </TabPanel>
          <TabPanel value={value} index={1}>
            <BarChart
              xAxis={[
                {
                  data: barData.labels,
                  scaleType: 'band',
                  tickLabelStyle: {
                    angle: -20,
                    fontSize: 10,
                    textAnchor: 'end'
                  },
                  tickPlacement: 'extremities',
                  tickLabelPlacement: 'middle'
                },
              ]}
              series={[{ data: barData.values }]}
              grid={{ vertical: true, horizontal: true }}
              yAxis={[{
                label: tUnits(study.resultsUnit)
              }]}
              margin={{ top: 5, right: 100, bottom: 100, left: 100 }}
              axisHighlight={{ x: 'none', }}
              {...barChartSettings}
            />
          </TabPanel>
          <TabPanel value={value} index={2}>
            <PieChart series={[{ data: pieData }]} height={300} />
          </TabPanel>
        </Box>
      </Box>
    </Container>
  )
}
