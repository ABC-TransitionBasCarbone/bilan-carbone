import { Post } from '@/services/posts'
import { styled } from '@mui/material'

export const StyledPostHeader = styled('div', { shouldForwardProp: (prop) => prop !== 'post' })<{ post: Post }>(
  ({ theme, post }) => ({
    position: 'relative',
    display: 'grid',
    gridTemplateColumns: '1fr 4fr',
    color: 'black',
    backgroundColor: theme.custom.postColors[post].light,
    height: '7.75rem',
    overflow: 'hidden',
    borderRadius: '0.5rem',
  }),
)

export const StyledIconColumn = styled('div')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '1rem',
  borderRight: `2px solid ${theme.palette.primary.light}`,
}))

export const StyledContentColumn = styled('div')({
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  alignItems: 'flex-start',
  gap: '0.25rem',
  padding: '0rem 1rem',
  position: 'relative',
  height: '100%',
  width: '100%',
})

export const StyledTitle = styled('div')(({ theme }) => ({
  color: theme.palette.primary.contrastText,
  fontSize: '1.125rem',
  fontWeight: 700,
  textAlign: 'left',
}))

export const StyledEmissionValue = styled('div')({
  fontSize: '1.25rem',
  fontWeight: 800,
  textAlign: 'left',
  color: 'white',
})
