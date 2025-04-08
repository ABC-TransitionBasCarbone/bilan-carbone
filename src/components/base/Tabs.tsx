import { Tabs as MuiTabs, Tab } from '@mui/material'
import { useTranslations } from 'next-intl'
import { ReactNode, useState } from 'react'

interface Props {
  tabs: string[]
  t: ReturnType<typeof useTranslations>
  content: ReactNode[]
}

const Tabs = ({ tabs, t, content }: Props) => {
  const [value, setValue] = useState(0)
  const handleChange = (event: React.SyntheticEvent, newValue: number) => {
    setValue(newValue)
  }
  return (
    <>
      <MuiTabs value={value} onChange={handleChange} variant="scrollable" scrollButtons="auto">
        {tabs.map((tab, index) => (
          <Tab key={index} label={t(tab)} />
        ))}
      </MuiTabs>
      {tabs.map((tab, index) => (
        <div role="tabpanel" hidden={value !== index} id={`tab-${index}`} aria-labelledby={`tab-${index}`} key={index}>
          {value === index && <div>{content[index]}</div>}
        </div>
      ))}
    </>
  )
}

export default Tabs
