import { ScatterItemIdentifier } from '@mui/x-charts'
import { ScatterChart as MuiScatterChart, ScatterSeries } from '@mui/x-charts/ScatterChart'

interface Props {
  series: ScatterSeries[]
  colors?: string[]
  maxX: number
  maxY: number
  xLabel?: string
  yLabel?: string
  disableTicks?: boolean
  xValueFormatter?: (value: number) => string
  yValueFormatter?: (value: number) => string
  onClick?: (post: string) => void
}

const ScatterChart = ({
  series,
  colors,
  maxX,
  maxY,
  xLabel,
  yLabel,
  xValueFormatter,
  yValueFormatter,
  disableTicks,
  onClick,
}: Props) => (
  <MuiScatterChart
    onItemClick={
      onClick
        ? (_: React.MouseEvent<SVGElement, MouseEvent>, params: ScatterItemIdentifier) =>
            onClick(params.seriesId as string)
        : undefined
    }
    height={400}
    xAxis={[{ min: 0, max: maxX, label: xLabel, valueFormatter: xValueFormatter, disableTicks }]}
    yAxis={[{ min: 0, max: maxY, label: yLabel, valueFormatter: yValueFormatter, disableTicks }]}
    series={series}
    colors={colors}
    sx={{ cursor: onClick ? 'pointer' : 'default' }}
  />
)

export default ScatterChart
