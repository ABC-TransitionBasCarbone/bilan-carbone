import Title from '@/components/base/Title'
import { TuneOutlined } from '@mui/icons-material'
import { Box, Tab, Tabs } from '@mui/material'
import { useTranslations } from 'next-intl'
import { useMemo, useState } from 'react'

export enum TabsPossibilities {
  table = 'table',
  pieChart = 'pieChart',
  barChart = 'barChart',
}

interface Props {
  activeTabs?: TabsPossibilities[]
  defaultTab?: TabsPossibilities
}
const ResultsTableAndGraphs = ({
  activeTabs = Object.values(TabsPossibilities),
  defaultTab = activeTabs[0],
}: Props) => {
  const [tabSelected, setTabSelected] = useState(defaultTab)
  const t = useTranslations('study.results')

  const TabComponent = useMemo(() => {
    switch (tabSelected) {
      case TabsPossibilities.table:
        return <div>{t('table')}</div>
      case TabsPossibilities.pieChart:
        return <div>{t('pieChart')}</div>
      case TabsPossibilities.barChart:
        return <div>{t('barChart')}</div>
      default:
        return null
    }
  }, [tabSelected, t])

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
        <TuneOutlined className="flex-end" />
      </div>
      {TabComponent}
    </Box>
  )
}

export default ResultsTableAndGraphs
