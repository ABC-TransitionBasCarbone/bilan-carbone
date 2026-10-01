export interface ProcessedChartData {
  label: string
  value: number
  color: string
}

export interface BarChartData {
  labels: string[]
  values: number[]
  colors: string[]
}

export interface BarChartSeriesData {
  label: string
  data: number[]
  color: string
  stack: string
}
