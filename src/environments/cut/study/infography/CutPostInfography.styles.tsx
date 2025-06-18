import { Link, styled } from '@mui/material'

export const StyledContainer = styled('div')(({ theme }) => ({
  position: 'relative',
  backgroundColor: theme.palette.primary.light,
  borderRadius: '0.5rem',
  overflow: 'visible',
  height: 'fit-content',

  '&:hover': {
    gap: '0.5rem',
    transform: 'translateY(-2px)',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
    zIndex: 10,
  },

  '&:active': {
    transform: 'translateY(0)',
  },
}))

export const StyledLink = styled(Link)({
  textDecoration: 'none',
  cursor: 'pointer',
})

export const StyledSubPostContainer = styled('div', { shouldForwardProp: (prop) => prop !== 'isVisible' })<{
  isVisible: boolean
}>(({ isVisible }) => ({
  overflow: 'hidden',
  maxHeight: isVisible ? '100%' : '0',
  opacity: isVisible ? 1 : 0,
}))

export const StyledSubPostItem = styled(Link, { shouldForwardProp: (prop) => prop !== 'validated' })<{
  validated?: boolean
}>(({ theme, validated }) => ({
  gap: '0.75rem',
  padding: '0.75rem 1rem',
  margin: '0.25rem 0',
  textDecoration: 'none',
  color: theme.palette.primary.contrastText,
  backgroundColor: validated ? theme.palette.success.light : theme.palette.error.light,
  borderRadius: '0.5rem',
  overflow: 'visible',

  '&:hover': {
    backgroundColor: validated ? theme.palette.success.dark : theme.palette.error.dark,
  },
}))

export const StyledIconWrapper = styled('div')({
  width: '1.5rem',
  height: '1.5rem',
  color: 'black',
  fontSize: '1rem',
})
