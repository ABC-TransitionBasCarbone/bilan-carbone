'use client'

import { ProcessedChartData, PieChart as UiPieChart } from '@abc-transitionbascarbone/ui'
import { formatNumber } from '@abc-transitionbascarbone/utils/number'

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
}

const formatValueAndUnit = (value: number | null, unitValue: string, dec = 2) =>
  `${formatNumber(value ?? 0, dec)} ${unitValue}`

const PieChart = ({
  items,
  unit = 'tCO₂e',
  title,
  height = 400,
  showTitle = true,
  showLabelsOnPie = true,
}: Props) => {
  const innerRingData: ProcessedChartData[] = items.map((item) => ({
    label: item.label,
    value: item.value,
    color: item.color,
  }))

  return (
    <UiPieChart
      innerRingData={innerRingData}
      outerRingData={[]}
      unitLabel={unit}
      title={title}
      height={height}
      showTitle={showTitle}
      showLabelsOnPie={showLabelsOnPie}
      type="post"
      formatNumber={formatNumber}
      formatValueAndUnit={formatValueAndUnit}
    />
  )
}

export default PieChart
