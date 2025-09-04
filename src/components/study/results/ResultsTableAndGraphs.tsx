import Box from '@/components/base/Box'
import Title from '@/components/base/Title'
import GlossaryModal from '@/components/modals/GlossaryModal'
import { computeTotalForPosts, ResultsByPost } from '@/services/results/consolidated'
import { BasicTypeCharts } from '@/utils/charts'
import HelpOutlineOutlinedIcon from '@mui/icons-material/HelpOutlineOutlined'
import TuneOutlinedIcon from '@mui/icons-material/TuneOutlined'
import { Tab, Tabs } from '@mui/material'
import { StudyResultUnit } from '@prisma/client'
import { useTranslations } from 'next-intl'
import { ReactNode, useCallback, useMemo, useState } from 'react'
import BarChart from '../charts/BarChart'
import PieChart from '../charts/PieChart'
import Filters from './Filters'
import styles from './ResultsTableAndGraphs.module.css'

export enum TabsPossibilities {
  barChart = 'barChart',
  pieChart = 'pieChart',
  table = 'table',
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
  title: string
  type: 'tag' | 'post'
  glossary?: string
}
const ResultsTableAndGraphs = <T extends BasicTypeCharts & { tagFamily?: { id: string; name: string } }>({
  activeTabs = Object.values(TabsPossibilities),
  defaultTab = activeTabs[0],
  computedResults,
  resultsUnit,
  TableComponent = () => <></>,
  title,
  type,
  glossary,
}: Props<T>) => {
  const [tabSelected, setTabSelected] = useState(defaultTab)
  const [filterAnchorEl, setFilterAnchorEl] = useState<HTMLElement | null>(null)
  const [filteredResultsWithTotal, setFilteredResultsWithTotal] = useState(computedResults)
  const [openGlossary, setOpenGlossary] = useState(false)

  const t = useTranslations('study.results')
  const tPost = useTranslations('emissionFactors.post')

  const TabComponent = useMemo(() => {
    switch (tabSelected) {
      case TabsPossibilities.table: {
        if (!TableComponent) {
          return null
        }
        return <TableComponent resultsUnit={resultsUnit} data={filteredResultsWithTotal} />
      }
      case TabsPossibilities.pieChart:
        return (
          <PieChart
            results={filteredResultsWithTotal}
            resultsUnit={resultsUnit ?? StudyResultUnit.T}
            onlyChildren={type === 'tag'}
            showSubLevel={true}
            showLabelsOnPie={true}
          />
        )
      case TabsPossibilities.barChart:
        return (
          <BarChart
            results={filteredResultsWithTotal}
            resultsUnit={resultsUnit}
            showLabelsOnBars={false}
            onlyChildren={type === 'tag'}
            showSubLevel={true}
          />
        )
      default:
        return null
    }
  }, [tabSelected, filteredResultsWithTotal, resultsUnit, type, TableComponent])

  const setFilteredResults = useCallback(
    (results: T[]) => {
      if (type === 'post') {
        const total = computeTotalForPosts(
          results.filter((post) => post.post !== 'total') as unknown as ResultsByPost[],
          tPost,
        ) as unknown as T
        setFilteredResultsWithTotal([...results.filter((post) => post.post !== 'total'), total])
      } else {
        setFilteredResultsWithTotal(results)
      }
    },
    [tPost, type],
  )

  return (
    <>
      <Box className={styles.container}>
        <Title as="h6" title={title} className="justify-center">
          {glossary && (
            <HelpOutlineOutlinedIcon color="secondary" className="ml-4 pointer" onClick={() => setOpenGlossary(true)} />
          )}
        </Title>
        <div className="flex flex-row justify-between align-center">
          {activeTabs.length > 1 ? (
            <Tabs value={tabSelected} onChange={(_e, v) => setTabSelected(v)}>
              {activeTabs.map((tab) => (
                <Tab key={tab} value={tab} label={t(tab)} data-testid={`${type}-${tab}`} />
              ))}
            </Tabs>
          ) : (
            <div />
          )}
          <div
            onClick={(event) => setFilterAnchorEl((prev) => (prev ? null : event.currentTarget))}
            className="pointer"
          >
            <TuneOutlinedIcon className="flex-end" />
          </div>
        </div>
        <Filters
          setFilteredResults={setFilteredResults}
          results={computedResults}
          type={type}
          anchorEl={filterAnchorEl}
          onClose={() => setFilterAnchorEl(null)}
        />
        {TabComponent}
      </Box>
      <GlossaryModal
        glossary={openGlossary && glossary ? `${glossary}` : ''}
        onClose={() => setOpenGlossary(false)}
        label="results-table-and-graph-glossary"
        t={t}
      >
        <span>{openGlossary && t(`${glossary}Description`)}</span>
      </GlossaryModal>
    </>
  )
}

export default ResultsTableAndGraphs
