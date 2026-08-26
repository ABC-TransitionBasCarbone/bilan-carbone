import { Box, styled, Typography } from '@mui/material'

type QuestionContainerStyleProps = {
  flat?: boolean
}

export const StyledQuestionContainer = styled(Box)(() => ({
  marginBottom: '2rem',
}))

export const StyledQuestionHeader = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'flat',
})<QuestionContainerStyleProps>(({ theme, flat = false }) => ({
  backgroundColor: flat ? 'transparent' : theme.palette.primary.light,
  padding: flat ? '0 0 1rem' : '1rem 1.5rem',
  borderRadius: flat ? 0 : '0.5rem 0.5rem 0 0',
  border: flat ? 'none' : `2px solid ${theme.palette.divider}`,
  marginBottom: 0,
  width: '100%',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
}))

export const StyledQuestionContent = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'flat',
})<QuestionContainerStyleProps>(({ theme, flat = false }) => ({
  backgroundColor: flat ? 'transparent' : theme.palette.background.paper,
  padding: flat ? 0 : '1.5rem',
  borderRadius: flat ? 0 : '0 0 0.5rem 0.5rem',
  border: flat ? 'none' : `2px solid ${theme.palette.divider}`,
  borderTop: 'none',
}))

export const StyledQuestionTitle = styled(Typography)(({ theme }) => ({
  color: theme.palette.text.primary,
  fontWeight: 600,
  fontSize: '1rem',
  margin: 0,
}))
