import { useDrawingArea } from '@mui/x-charts'
import classNames from 'classnames'
import { Fragment, ReactNode } from 'react'
import styles from './DrawingArea.module.css'

export interface DrawingProps {
  left: number
  top: number
  width: number
  height: number
}

interface RectDrawingProps extends DrawingProps {
  color: string
  margin?: number
}

export const TopRightRect = (props: RectDrawingProps) => (
  <Rect
    x={props.left + (props.width / 2) * (1 + (props.margin || 0))}
    y={props.top + (props.height / 2) * (props.margin || 0)}
    {...props}
  />
)
export const TopLeftRect = (props: RectDrawingProps) => (
  <Rect
    x={props.left + (props.width / 2) * (props.margin || 0)}
    y={props.top + (props.height / 2) * (props.margin || 0)}
    {...props}
  />
)
export const BottomRightRect = (props: RectDrawingProps) => (
  <Rect
    x={props.left + (props.width / 2) * (1 + (props.margin || 0))}
    y={props.top + (props.height / 2) * (1 + (props.margin || 0))}
    {...props}
  />
)
const Rect = ({ x, y, height, width, color, margin = 0.1 }: { x: number; y: number } & RectDrawingProps) => (
  <rect x={x} y={y} width={(width / 2) * (1 - 2 * margin)} height={(height / 2) * (1 - 2 * margin)} fill={color} />
)

const Path = (props: React.SVGProps<SVGPathElement>) => <path className={styles.path} {...props} />

interface MultilineTextProps {
  x: number
  y: number
  width: number
  height: number
  className?: string
  children: React.ReactNode
}

export const TopRightMultilineText = (
  props: DrawingProps & { margin?: number; className?: string; children: React.ReactNode },
) => {
  const { left, top, width, height, margin = 0.1 } = props
  return (
    <MultilineText
      {...props}
      x={left + (width / 2) * (1 + margin)}
      y={top + height * margin}
      width={(width / 2) * (1 - margin * 2)}
    />
  )
}
export const TopLeftMultilineText = (
  props: DrawingProps & { margin?: number; className?: string; children: React.ReactNode },
) => {
  const { left, top, width, height, margin = 0.1 } = props
  return (
    <MultilineText
      {...props}
      x={left + (width / 2) * margin}
      y={top + height * margin}
      width={(width / 2) * (1 - margin * 2)}
      height={(height / 2) * (1 - 2 * margin)}
    />
  )
}
export const BottomRightMultilineText = (
  props: DrawingProps & { margin?: number; className?: string; children: React.ReactNode },
) => {
  const { left, top, width, height, margin = 0.1 } = props
  return (
    <MultilineText
      {...props}
      x={left + (width / 2) * (1 + margin)}
      y={top + (height / 2) * (1 + 2 * margin)}
      width={(width / 2) * (1 - margin * 2)}
      height={(height / 2) * (1 - 2 * margin)}
    />
  )
}
export const MultilineText = ({ x, y, width, height, className, children }: MultilineTextProps) => (
  <foreignObject x={x} y={y} width={width} height={height}>
    <div className={classNames(styles.multilineText, className)}>{children}</div>
  </foreignObject>
)

const Arrow = ({ x1, y1, x2, y2 }: { x1: number; y1: number; x2: number; y2: number }) => (
  <>
    <defs>
      <marker id="arrowhead" markerWidth="8" markerHeight="8" refX="4" refY="4" orient="auto" markerUnits="strokeWidth">
        <path className={styles.arrow} d="M0,0 L8,4 L0,8 Z" fill="var(--mui-palette-grey-500)" />
      </marker>
    </defs>
    <line className={styles.path} x1={x1} y1={y1} x2={x2} y2={y2} markerEnd="url(#arrowhead)" />
  </>
)

interface Props {
  Rect?: (props: DrawingProps) => ReactNode
  Text?: (props: DrawingProps) => ReactNode
}

const DrawingAreaBox = ({ Rect, Text }: Props) => {
  const { left, top, width, height } = useDrawingArea()
  const margin = 0

  return (
    <Fragment>
      <Arrow x1={left} y1={top + height} x2={left + width} y2={top + height} />
      <Arrow x1={left} y1={top + height} x2={left} y2={top} />
      <Path d={`M ${left + width / 2} ${top + height * margin} L ${left + width / 2} ${top + height * (1 - margin)}`} />
      <Path d={`M ${left + width * margin} ${top + height / 2} L ${left + width * (1 - margin)} ${top + height / 2}`} />
      {Rect && <Rect left={left} top={top} width={width} height={height} />}
      {Text && <Text left={left} top={top} width={width} height={height} />}
    </Fragment>
  )
}

export default DrawingAreaBox
