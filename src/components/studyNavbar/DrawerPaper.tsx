import React from 'react'

// Custom Paper component for Drawer that filters out non-standard props
type DrawerPaperProps = React.HTMLAttributes<HTMLDivElement> & {
  square?: boolean
  ownerState?: unknown
}

const DrawerPaper = React.forwardRef<HTMLDivElement, DrawerPaperProps>((props, ref) => {
  // Filter out 'square' and 'ownerState' and any other non-standard props
  const { square, ownerState, ...rest } = props
  return <div ref={ref} {...rest} />
})

export default DrawerPaper
