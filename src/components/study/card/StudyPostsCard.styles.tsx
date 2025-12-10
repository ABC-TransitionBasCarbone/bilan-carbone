import { Post } from '@/services/posts'
import { styled } from '@mui/material'

export const StyledPostContainer = styled('div', { shouldForwardProp: (prop) => prop !== 'post' })<{ post: Post }>(
  ({ theme, post }) => ({
    borderRadius: '1rem',
    color: 'white',
    flex: '1',
    maxWidth: 'var(--card-max-length)',
    backgroundColor: theme.custom.postColors[post].light,
  }),
)

export const StyledProgressLayer = styled('div', { shouldForwardProp: (prop) => prop !== 'post' })<{
  post: Post
  percent: number
}>(({ theme, post, percent }) => ({
  borderRadius: '1rem',

  height: '100%',
  position: 'absolute',
  top: '0',
  left: '0',
  width: `${percent.toFixed(0)}%`,

  backgroundColor: theme.custom.postColors[post].dark,
}))
