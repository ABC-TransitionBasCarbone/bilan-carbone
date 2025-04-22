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
import { BarChart } from '@mui/x-charts'
import { PieChart } from '@mui/x-charts/PieChart'
import { Export, ExportRule, SubPost } from '@prisma/client'
import { useTranslations } from 'next-intl'
import { SyntheticEvent, useMemo, useState } from 'react'

import TabPanel from '@/components/tabPanel/tabPanel'
import { axisClasses } from '@mui/x-charts/ChartsAxis'

interface Props {
  study: FullStudy
  rules: ExportRule[]
  emissionFactorsWithParts: EmissionFactorWithParts[]
  validatedOnly: boolean
}

const barChartSettings = {
  yAxis: [
    {
      label: 'tCo2',
    },
  ],
  height: 300,
  sx: {
    marginLeft: '6rem',
    [`.${axisClasses.left} .${axisClasses.label}`]: {
      transform: 'translate(-10px, 0)',
    },
  },
  borderRadius: 10,
}

function a11yProps(index: number) {
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

  const { studySite, setSite } = useStudySite(study, true)

  const resultsByPost = useMemo(
    () => computeResultsByPost(study, tPost, studySite, true, validatedOnly),
    [studySite, validatedOnly],
  )

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
        label: post,
      }))
  }, [resultsByPost])

  const pieData = useMemo(() => {
    return computeResults.filter((computeResult) => computeResult.value > 0)
  }, [computeResults])

  const barData = useMemo(() => {
    return computeResults.map(({ label, value }) => ({ label, value: value / 1000 }))
  }, [computeResults])

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
              dataset={barData}
              xAxis={[
                {
                  scaleType: 'band',
                  dataKey: 'label',
                  colorMap: {
                    type: 'ordinal',
                    colors: [getComputedStyle(document.body).getPropertyValue('--primary-500')],
                  },
                },
              ]}
              series={[{ dataKey: 'value' }]}
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
