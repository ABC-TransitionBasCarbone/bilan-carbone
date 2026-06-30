'use client'

import { BarChartData, BarChart as UiBarChart } from '@abc-transitionbascarbone/ui'
import { BasicTypeCharts } from '@abc-transitionbascarbone/utils/charts'
import { formatNumber } from '@abc-transitionbascarbone/utils/number'

interface Props {
  items: BasicTypeCharts[]
  unit?: string
  targetLabel?: string
  targetValue?: number
  title?: string
  height?: number
  showTitle?: boolean
  showLegend?: boolean
  showLabelsOnBars?: boolean
  skipAnimation?: boolean
}

const StudyBarChart = ({
  items,
  unit = 'tCO₂e',
  targetLabel,
  targetValue,
  title,
  height = 400,
  showTitle = true,
  showLegend = false,
  showLabelsOnBars = true,
  skipAnimation = false,
}: Props) => {
  const barData: BarChartData = {
    labels: items.map((item) => item.label),
    values: items.map((item) => item.value),
    colors: items.map((item) => item.color || ''),
  }

  return (
    <UiBarChart
      barData={barData}
      title={title}
      height={height}
      showTitle={showTitle}
      showLegend={showLegend}
      showLabelsOnBars={showLabelsOnBars}
      skipAnimation={skipAnimation}
      emissionsLabel={targetLabel}
      targetValue={targetValue}
      unitLabel={unit}
      formatNumber={formatNumber}
    />
  )
}

export default StudyBarChart
