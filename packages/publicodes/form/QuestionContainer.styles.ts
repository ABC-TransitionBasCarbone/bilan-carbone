import { Box, styled, Typography } from '@mui/material'

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
