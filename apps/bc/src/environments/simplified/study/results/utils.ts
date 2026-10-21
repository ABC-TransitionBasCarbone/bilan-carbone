export type ChartType = 'pie' | 'bar' | 'table' | 'ratio'

export const defaultChartOrder: Record<ChartType, number> = {
  table: 0,
  bar: 1,
  pie: 2,
  ratio: 3,
}

export const tabsLabels = ['pie', 'bar', 'table', 'ratio']

export const a11yProps = (index: number) => {
  return {
    id: `full-width-tab-${index}`,
    'aria-controls': `full-width-tabpanel-${index}`,
  }
}
