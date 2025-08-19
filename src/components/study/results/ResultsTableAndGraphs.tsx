import Title from '@/components/base/Title'
import TuneOutlinedIcon from '@mui/icons-material/TuneOutlined'
import { Box, Tab, Tabs } from '@mui/material'
import { StudyResultUnit } from '@prisma/client'
import { useTranslations } from 'next-intl'
import { useMemo, useState } from 'react'
import PieChart from '../charts/PieChart'
import Filters from './Filters'

export enum TabsPossibilities {
  table = 'table',
  pieChart = 'pieChart',
  barChart = 'barChart',
}

interface Props<T> {
  activeTabs?: TabsPossibilities[]
  defaultTab?: TabsPossibilities
  computedResults: T[]
  resultsUnit?: StudyResultUnit
}
const ResultsTableAndGraphs = <
  T extends { value: number; label: string; post?: string; tagFamily?: { id: string; name: string } },
>({
  activeTabs = Object.values(TabsPossibilities),
  defaultTab = activeTabs[0],
  computedResults,
  resultsUnit,
}: Props<T>) => {
  const [tabSelected, setTabSelected] = useState(defaultTab)
  const [displayFilter, setDisplayFilter] = useState(false)
  const [filteredResults, setFilteredResults] = useState(computedResults)

  const t = useTranslations('study.results')

  const TabComponent = useMemo(() => {
    switch (tabSelected) {
      case TabsPossibilities.table:
        return <div>{t('table')}</div>
      case TabsPossibilities.pieChart:
        return <PieChart results={filteredResults} resultsUnit={resultsUnit ?? StudyResultUnit.T} hideLegend />
      case TabsPossibilities.barChart:
        return <div>{t('barChart')}</div>
      default:
        return null
    }
  }, [tabSelected, t, filteredResults, resultsUnit])

  return (
    <Box className="cardContainer mt2">
      <Title as="h6" title={t('tagPieChartTitle')} />
      <div className="flex flex-row justify-between align-center">
        {activeTabs.length > 1 ? (
          <Tabs value={tabSelected} onChange={(_e, v) => setTabSelected(v)}>
            {activeTabs.map((tab) => (
              <Tab key={tab} value={tab} label={t(tab)} />
            ))}
          </Tabs>
        ) : (
          <div />
        )}
        <div onClick={() => setDisplayFilter(!displayFilter)} className="pointer">
          <TuneOutlinedIcon className="flex-end" />
        </div>
      </div>
      <Filters setFilteredResults={setFilteredResults} results={computedResults} type="tag" display={displayFilter} />
      {!displayFilter && TabComponent}
    </Box>
  )
}

export default ResultsTableAndGraphs
