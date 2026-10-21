import { SvgIcon, SvgIconProps } from '@mui/material'

const SheetIcon = (props: SvgIconProps) => {
  return (
    <SvgIcon viewBox="0 0 24 24" {...props}>
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" fill="none" stroke="currentColor" strokeWidth="2" />
      <line x1="3" y1="9" x2="21" y2="9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <line x1="3" y1="15" x2="21" y2="15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <line x1="9" y1="9" x2="9" y2="21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <line x1="15" y1="9" x2="15" y2="21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </SvgIcon>
  )
}

export default SheetIcon
