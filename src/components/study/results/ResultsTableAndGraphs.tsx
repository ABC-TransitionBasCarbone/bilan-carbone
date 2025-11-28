import Box from '@/components/base/Box'
import Title from '@/components/base/Title'
import GlossaryModal from '@/components/modals/GlossaryModal'
import { computeTotalForPosts, ResultsByPost } from '@/services/results/consolidated'
import { BasicTypeCharts } from '@/utils/charts'
import FilterListIcon from '@mui/icons-material/FilterList'
import HelpOutlineOutlinedIcon from '@mui/icons-material/HelpOutlineOutlined'
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined'
import { Checkbox, FormControlLabel, Menu, Tab, Tabs } from '@mui/material'
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
  exportType?: string
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
  exportType,
}: Props<T>) => {
  const [tabSelected, setTabSelected] = useState(defaultTab)
  const [filterAnchorEl, setFilterAnchorEl] = useState<HTMLElement | null>(null)
  const [settingsAnchorEl, setSettingsAnchorEl] = useState<HTMLElement | null>(null)
  const [filteredResultsWithTotal, setFilteredResultsWithTotal] = useState(computedResults)
  const [openGlossary, setOpenGlossary] = useState(false)
  const [showSubLevel, setShowSubLevel] = useState(true)

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
            showSubLevel={showSubLevel}
            showLabelsOnPie={true}
            type={type}
          />
        )
      case TabsPossibilities.barChart:
        return (
          <BarChart
            results={filteredResultsWithTotal}
            resultsUnit={resultsUnit}
            showLabelsOnBars={false}
            showSubLevel={showSubLevel}
            showLegend={false}
            type={type}
          />
        )
      default:
        return null
    }
  }, [tabSelected, filteredResultsWithTotal, resultsUnit, type, TableComponent, showSubLevel])

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
        <Title as="h6" title={title} className="justify-center mb1">
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
          <div className="flex gapped-2">
            <div
              onClick={(event) => setSettingsAnchorEl((prev) => (prev ? null : event.currentTarget))}
              className="pointer ml-2"
            >
              <SettingsOutlinedIcon className="flex-end" color="primary" />
            </div>
            <div
              onClick={(event) => setFilterAnchorEl((prev) => (prev ? null : event.currentTarget))}
              className="pointer"
            >
              <FilterListIcon className="flex-end" color="primary" />
            </div>
          </div>
        </div>
        <Menu
          anchorEl={settingsAnchorEl}
          open={Boolean(settingsAnchorEl)}
          onClose={() => setSettingsAnchorEl(null)}
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'right',
          }}
          transformOrigin={{
            vertical: 'top',
            horizontal: 'right',
          }}
        >
          <div className="px1">
            <FormControlLabel
              control={<Checkbox checked={showSubLevel} onChange={(e) => setShowSubLevel(e.target.checked)} />}
              label={type === 'tag' ? t('showSubTags') : t('showSubPosts')}
            />
          </div>
        </Menu>
        <Filters
          setFilteredResults={setFilteredResults}
          results={computedResults}
          type={type}
          anchorEl={filterAnchorEl}
          onClose={() => setFilterAnchorEl(null)}
          exportType={exportType}
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
