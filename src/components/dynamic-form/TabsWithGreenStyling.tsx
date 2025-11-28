import { Translations } from '@/types/translation'
import { Box, Tabs as MuiTabs, Tab, styled } from '@mui/material'
import { ReactNode, useMemo, useState } from 'react'

const StyledTabs = styled(MuiTabs)(({ theme }) => ({
  borderBottom: `0.125rem solid ${theme.palette.primary.main}`,
  maxWidth: '100%',
  '& .MuiTabs-indicator': {
    backgroundColor: theme.palette.primary.main,
    height: '0.1875rem',
  },
  '& .MuiTab-root': {
    color: theme.palette.text.secondary,
    fontWeight: 500,
    fontSize: '1rem',
    textTransform: 'none',
    minHeight: '3rem',
    padding: '0.75rem 1.5rem',
    transition: 'all 0.2s ease-in-out',
    '&:hover': {
      color: theme.palette.primary.dark,
      backgroundColor: theme.palette.primary.light,
    },
    '&.Mui-selected': {
      color: 'white',
      backgroundColor: `${theme.palette.primary.main} !important`,
      fontWeight: 600,
      borderRadius: '0.5rem 0.5rem 0 0',
      '&:hover': {
        backgroundColor: `${theme.palette.primary.dark} !important`,
      },
    },
  },
}))

const StyledContainer = styled(Box)(() => ({
  width: '100%',
  overflow: 'hidden',
}))

const StyledTabContent = styled(Box)(() => ({
  padding: '2rem 0',
  width: '100%',
}))

interface Props {
  tabs: string[]
  t: Translations
  content: ReactNode
  activeTab?: number
  setActiveTab?: (n: number) => void
}

const TabsWithGreenStyling = ({ tabs, t, content, setActiveTab, activeTab = 0 }: Props) => {
  const [value, setValue] = useState(0)

  const handleChange = (_event: React.SyntheticEvent, newValue: number) => {
    if (activeTab === undefined || !setActiveTab) {
      setValue(newValue)
    } else {
      setActiveTab(newValue)
    }
  }

  const currentTab = useMemo(() => (activeTab !== undefined ? activeTab : value), [activeTab, value])

  return (
    <StyledContainer>
      <StyledTabs value={currentTab} onChange={handleChange} variant="scrollable" scrollButtons="auto">
        {tabs.map((tab, index) => (
          <Tab key={index} label={t(tab)} />
        ))}
      </StyledTabs>

      <StyledTabContent>
        <Box
          className="w100"
          role="tabpanel"
          id={`green-tab-${currentTab}`}
          aria-labelledby={`green-tab-${currentTab}`}
        >
          {content}
        </Box>
      </StyledTabContent>
    </StyledContainer>
  )
}

export default TabsWithGreenStyling
