import { ScatterChart as MuiScatterChart, ScatterSeries } from '@mui/x-charts/ScatterChart'

interface Props {
  series: ScatterSeries[]
  colors?: string[]
  maxX: number
  maxY: number
  xLabel?: string
  yLabel?: string
  xValueFormatter?: (value: number) => string
}

const ScatterChart = ({ series, colors, maxX, maxY, xLabel, yLabel, xValueFormatter }: Props) => (
  <MuiScatterChart
    height={400}
    xAxis={[{ min: 0, max: maxX, label: xLabel, valueFormatter: xValueFormatter }]}
    yAxis={[{ min: 0, max: maxY, label: yLabel }]}
    series={series}
    colors={colors}
  />
)

export default ScatterChart
