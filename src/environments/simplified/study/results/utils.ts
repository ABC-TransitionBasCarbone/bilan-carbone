export type ChartType = 'pie' | 'bar' | 'table'

export const defaultChartOrder: Record<ChartType, number> = {
  table: 0,
  bar: 1,
  pie: 2,
}

export const tabsLabels = [
  { key: 'table', label: 'Tableau' },
  { key: 'bar', label: 'Diagramme en barres' },
  { key: 'pie', label: 'Diagramme circulaire' },
]

export const a11yProps = (index: number) => {
  return {
    id: `full-width-tab-${index}`,
    'aria-controls': `full-width-tabpanel-${index}`,
  }
}
