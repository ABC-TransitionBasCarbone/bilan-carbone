import { styled } from '@mui/material'
import { useDrawingArea } from '@mui/x-charts'
import { Fragment, ReactNode } from 'react'

export interface DrawingProps {
  left: number
  top: number
  width: number
  height: number
}

const StyledPath = styled('path')(({ theme }) => ({
  fill: 'none',
  stroke: theme.palette.text.primary,
  shapeRendering: 'crispEdges',
  strokeWidth: 1,
  pointerEvents: 'none',
}))

export const StyledText = styled('text')(({ theme }) => ({
  stroke: 'none',
  fill: theme.palette.text.primary,
  shapeRendering: 'crispEdges',
}))

export const StyledMultilineText = styled('div')(({ theme }) => ({
  color: theme.palette.text.primary,
  whiteSpace: 'normal',
  wordWrap: 'break-word',
  lineHeight: 1.2,
}))

interface MultilineTextProps {
  x: number
  y: number
  width: number
  height: number
  className?: string
  children: React.ReactNode
}

export const MultilineText = ({ x, y, width, height, className, children }: MultilineTextProps) => (
  <foreignObject x={x} y={y} width={width} height={height}>
    <StyledMultilineText className={className}>{children}</StyledMultilineText>
  </foreignObject>
)

interface Props {
  Rect?: (props: DrawingProps) => ReactNode
  Text?: (props: DrawingProps) => ReactNode
}

const DrawingAreaBox = ({ Rect, Text }: Props) => {
  const { left, top, width, height } = useDrawingArea()
  const margin = 0.02

  return (
    <Fragment>
      <StyledPath
        d={`M ${left + width / 2} ${top + height * margin} L ${left + width / 2} ${top + height * (1 - margin)}`}
      />
      <StyledPath
        d={`M ${left + width * margin} ${top + height / 2} L ${left + width * (1 - margin)} ${top + height / 2}`}
      />
      {Rect && <Rect left={left} top={top} width={width} height={height} />}
      {Text && <Text left={left} top={top} width={width} height={height} />}
    </Fragment>
  )
}

export default DrawingAreaBox
