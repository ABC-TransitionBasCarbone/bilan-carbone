import { DrawingProps, MultilineText } from '../charts/DrawingArea'

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
