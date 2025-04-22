interface TabPanelProps {
  children?: React.ReactNode
  dir?: string
  index: number
  value: number
}

const TabPanel = ({ children, index, value, ...other }: TabPanelProps) => {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`full-width-tabpanel-${index}`}
      aria-labelledby={`full-width-tab-${index}`}
      {...other}
    >
      {value === index && <>{children}</>}
    </div>
  )
}

export default TabPanel
