import { Box, styled, Tab, Typography } from '@mui/material'

// Common style generators
export const StyledQuestionContainer = styled(Box)(() => ({
  marginBottom: '2rem',
}))

export const StyledQuestionHeader = styled(Box)(({ theme }) => ({
  backgroundColor: theme.palette.primary.light,
  padding: '1rem 1.5rem',
  borderRadius: '0.5rem 0.5rem 0 0',
  marginBottom: 0,
  width: '100%',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
}))

export const StyledQuestionContent = styled(Box)(({ theme }) => ({
  backgroundColor: theme.palette.background.paper,
  padding: '1.5rem',
  borderRadius: '0 0 0.5rem 0.5rem',
  border: `1px solid ${theme.palette.divider}`,
  borderTop: 'none',
}))

export const StyledQuestionTitle = styled(Typography)(({ theme }) => ({
  color: theme.palette.text.primary,
  fontWeight: 600,
  fontSize: '1rem',
  margin: 0,
}))

export const StyledTab = styled(Tab)(({ theme }) => ({
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

export const StyledEmissionResults = styled(Box)(({ theme }) => ({
  marginTop: '1rem',
  padding: '1rem',
  backgroundColor: theme.palette.grey[50],
  borderRadius: '0.25rem',
  borderLeft: `4px solid ${theme.palette.success.main}`,
  '& p': {
    margin: '0 0 0.5rem 0',
    fontWeight: 600,
    color: theme.palette.text.primary,
  },
}))
