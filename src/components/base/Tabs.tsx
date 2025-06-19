import { Tabs as MuiTabs, Tab } from '@mui/material'
import { useTranslations } from 'next-intl'
import { ReactNode, useMemo, useState } from 'react'

interface Props {
  tabs: string[]
  t: ReturnType<typeof useTranslations>
  content: ReactNode[]
  activeTab?: number
  setActiveTab?: (n: number) => void
}

const Tabs = ({ tabs, t, content, setActiveTab, activeTab = 0 }: Props) => {
  const [value, setValue] = useState(0)
  const handleChange = (_event: React.SyntheticEvent, newValue: number) => {
    if (activeTab === undefined || !setActiveTab) {
      setValue(newValue)
    } else {
      setActiveTab(newValue)
    }
  }

  const currentTab = useMemo(() => activeTab || value, [activeTab, value])

  return (
    <>
      <MuiTabs value={currentTab} onChange={handleChange} variant="scrollable" scrollButtons="auto">
        {tabs.map((tab, index) => (
          <Tab key={index} label={t(tab)} />
        ))}
      </MuiTabs>
      {tabs.map((tab, index) => (
        <div
          role="tabpanel"
          hidden={currentTab !== index}
          id={`tab-${index}`}
          aria-labelledby={`tab-${index}`}
          key={tab}
        >
          {currentTab === index && <div>{content[index]}</div>}
        </div>
      ))}
    </>
  )
}

export default Tabs
