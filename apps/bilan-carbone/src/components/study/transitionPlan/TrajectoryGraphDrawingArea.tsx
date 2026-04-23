import { useDrawingArea, useXScale } from '@mui/x-charts'
import { DrawingProps, MultilineText } from '../charts/DrawingArea'

export const PastAreaBackground = ({ untilYear }: { untilYear: number }) => {
  const { left, top, height } = useDrawingArea()
  const xScale = useXScale() as (value: number) => number

  const x = left
  const rectWidth = xScale(untilYear) - left

  if (rectWidth <= 0) {
    return null
  }

  return <rect x={x} y={top} width={rectWidth} height={height} fill="var(--trajectory-gray-area)" />
}

export const BottomLeftMultilineText = (
  props: DrawingProps & {
    margin?: number
    className?: string
    children: React.ReactNode
  },
) => {
  const { left, top, width, height, margin = 0.05 } = props

  const boxHeight = height * 0.1

  return (
    <MultilineText
      {...props}
      x={left + margin}
      y={top + height - boxHeight}
      width={width * 0.2 + margin}
      height={boxHeight}
    />
  )
}
