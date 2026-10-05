import { Translations } from '@abc-transitionbascarbone/shared'
import type { Post } from '@abc-transitionbascarbone/shared/utils/charts'
import { Box, Tabs as MuiTabs, Tab, styled } from '@mui/material'
import { ReactNode, useMemo, useState } from 'react'

const StyledTabs = styled(MuiTabs, { shouldForwardProp: (prop) => prop !== 'post' })<{ post: Post }>(
  ({ theme, post }) => ({
    borderBottom: `0.125rem solid ${theme.custom.postColors[post].dark ?? theme.custom.postColors[post].light}`,
    maxWidth: '100%',
    '& .MuiTabs-indicator': {
      backgroundColor: theme.custom.postColors[post].light,
      height: '0.1875rem',
    },
    '&:has(.Mui-selected:hover) .MuiTabs-indicator': {
      backgroundColor: theme.custom.postColors[post].dark ?? theme.custom.postColors[post].light,
    },
    '& .MuiTab-root': {
      color: theme.custom.postColors[post].light,
      fontWeight: 500,
      fontSize: '1rem',
      textTransform: 'none',
      minHeight: '3rem',
      padding: '0.75rem 1.5rem',
      transition: 'all 0.2s ease-in-out',
      '&:hover': {
        color: theme.custom.postColors[post].dark ?? theme.custom.postColors[post].light,
        backgroundColor: theme.palette.primary.light,
      },
      '&.Mui-selected': {
        color: theme.palette.getContrastText(theme.custom.postColors[post].light),
        backgroundColor: `${theme.custom.postColors[post].light} !important`,
        fontWeight: 600,
        borderRadius: '0.5rem 0.5rem 0 0',
        '&:hover': {
          color: theme.palette.getContrastText(
            theme.custom.postColors[post].dark ?? theme.custom.postColors[post].light,
          ),
          backgroundColor: `${theme.custom.postColors[post].dark ?? theme.custom.postColors[post].light} !important`,
        },
      },
    },
  }),
)

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
  post: Post
}

const TabsWithGreenStyling = ({ tabs, t, content, setActiveTab, activeTab = 0, post }: Props) => {
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
      <StyledTabs value={currentTab} onChange={handleChange} variant="scrollable" scrollButtons="auto" post={post}>
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
