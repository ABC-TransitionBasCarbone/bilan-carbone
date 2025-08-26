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

const Path = (props: React.SVGProps<SVGPathElement>) => <path className={styles.path} {...props} />

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
    <div className={classNames(styles.multilineText, className)}>{children}</div>
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
      <Path d={`M ${left + width / 2} ${top + height * margin} L ${left + width / 2} ${top + height * (1 - margin)}`} />
      <Path d={`M ${left + width * margin} ${top + height / 2} L ${left + width * (1 - margin)} ${top + height / 2}`} />
      {Rect && <Rect left={left} top={top} width={width} height={height} />}
      {Text && <Text left={left} top={top} width={width} height={height} />}
    </Fragment>
  )
}

export default DrawingAreaBox
