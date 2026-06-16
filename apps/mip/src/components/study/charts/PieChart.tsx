'use client'

import { ProcessedChartData, PieChart as UiPieChart } from '@abc-transitionbascarbone/ui'

export type PieChartItem = {
  key: string
  label: string
  value: number
  color: string
}

interface Props {
  items: PieChartItem[]
  unit?: string
  title?: string
  height?: number
  showTitle?: boolean
  showLabelsOnPie?: boolean
  type?: 'post' | 'tag'
}

const PieChart = ({
  items,
  unit = 'tCO₂e',
  title,
  height = 400,
  showTitle = true,
  showLabelsOnPie = true,
  type = 'post',
}: Props) => {
  const innerRingData: ProcessedChartData[] = items.map((item) => ({
    label: item.label,
    value: item.value,
    color: item.color,
  }))

  const formatNumber = (value?: number, dec = 0) =>
    (value || 0).toLocaleString('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: dec })
  const formatValueAndUnit = (value: number | null, unitValue: string, dec = 2) =>
    `${formatNumber(value ?? 0, dec)} ${unitValue}`

  return (
    <UiPieChart
      innerRingData={innerRingData}
      outerRingData={[]}
      unitLabel={unit}
      title={title}
      height={height}
      showTitle={showTitle}
      showLabelsOnPie={showLabelsOnPie}
      type={type}
      formatNumber={formatNumber}
      formatValueAndUnit={formatValueAndUnit}
    />
  )
}

export default PieChart
