import Box from '@/components/base/Box'
import Title from '@/components/base/Title'
import BarChartIcon from '@mui/icons-material/BarChart'
import TuneOutlinedIcon from '@mui/icons-material/TuneOutlined'
import { Tab, Tabs } from '@mui/material'
import { StudyResultUnit } from '@prisma/client'
import { useTranslations } from 'next-intl'
import { ReactNode, useMemo, useState } from 'react'
import BarChart from '../charts/BarChart'
import PieChart from '../charts/PieChart'
import Filters from './Filters'
import styles from './ResultsTableAndGraphs.module.css'

export enum TabsPossibilities {
  table = 'table',
  pieChart = 'pieChart',
  barChart = 'barChart',
}

interface ResultsTableProps<T> {
  resultsUnit: StudyResultUnit
  data: T[]
}

interface Props<T> {
  activeTabs?: TabsPossibilities[]
  defaultTab?: TabsPossibilities
  computedResults: T[]
  resultsUnit: StudyResultUnit
  TableComponent?: (props: ResultsTableProps<T>) => ReactNode
}
const ResultsTableAndGraphs = <
  T extends { value: number; label: string; post?: string; tagFamily?: { id: string; name: string } },
>({
  activeTabs = Object.values(TabsPossibilities),
  defaultTab = activeTabs[0],
  computedResults,
  resultsUnit,
  TableComponent = () => <></>,
}: Props<T>) => {
  const [tabSelected, setTabSelected] = useState(defaultTab)
  const [displayFilter, setDisplayFilter] = useState(false)
  const [filteredResults, setFilteredResults] = useState(computedResults)
  const tUnits = useTranslations('study.results.units')

  const t = useTranslations('study.results')

  const TabComponent = useMemo(() => {
    switch (tabSelected) {
      case TabsPossibilities.table:
        return <TableComponent resultsUnit={resultsUnit} data={filteredResults} />
      case TabsPossibilities.pieChart:
        return <PieChart results={filteredResults} resultsUnit={resultsUnit ?? StudyResultUnit.T} hideLegend />
      case TabsPossibilities.barChart:
        return <BarChart results={filteredResults} resultsUnit={resultsUnit} />
      default:
        return null
    }
  }, [tabSelected, TableComponent, filteredResults, resultsUnit])

  return (
    <Box className={styles.container}>
      <Title as="h6" title={t('tagPieChartTitle', { unit: tUnits(resultsUnit) })} className="justify-center" />
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
          {displayFilter ? <BarChartIcon className="flex-end" /> : <TuneOutlinedIcon className="flex-end" />}
        </div>
      </div>
      <Filters setFilteredResults={setFilteredResults} results={computedResults} type="tag" display={displayFilter} />
      {!displayFilter && TabComponent}
    </Box>
  )
}

export default ResultsTableAndGraphs
