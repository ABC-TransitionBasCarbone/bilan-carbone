import { CardContent, CardHeader, styled } from '@mui/material'

export const StyledCardHeader = styled(CardHeader)(({ theme }) => ({
  backgroundColor: theme.palette.primary.light,
  opacity: 0.6,
  color: theme.palette.text.primary,
  fontWeight: 600,
  fontSize: '1rem',
  margin: 0,
}))

export const StyledCardContent = styled(CardContent)(({ theme }) => ({
  padding: '1rem',
}))
