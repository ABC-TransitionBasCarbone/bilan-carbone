import { ScatterItemIdentifier } from '@mui/x-charts'
import { ScatterChart as MuiScatterChart, ScatterPlot, ScatterSeries } from '@mui/x-charts/ScatterChart'
import { ReactNode } from 'react'
import DrawingAreaBox, { DrawingProps } from './DrawingArea'

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
  Rect?: (props: DrawingProps) => ReactNode
  Text?: (props: DrawingProps) => ReactNode
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
  Rect,
  Text,
}: Props) => (
  <MuiScatterChart
    height={400}
    xAxis={[{ min: 0, max: maxX, label: xLabel, valueFormatter: xValueFormatter, disableTicks }]}
    yAxis={[{ min: 0, max: maxY, label: yLabel, valueFormatter: yValueFormatter, disableTicks }]}
    series={series}
    colors={colors}
    sx={{ cursor: onClick ? 'pointer' : 'default' }}
  >
    <DrawingAreaBox Rect={Rect} Text={Text} />
    <ScatterPlot
      onItemClick={
        onClick
          ? (_: React.MouseEvent<SVGElement, MouseEvent>, params: ScatterItemIdentifier) =>
              onClick(params.seriesId as string)
          : undefined
      }
    />
  </MuiScatterChart>
)

export default ScatterChart
