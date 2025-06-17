import { Post } from '@/services/posts'
import { styled } from '@mui/material'
import Link from 'next/link'

export const StyledLink = styled(Link)<{ post: Post; displayChildren: boolean }>(
  ({ theme, post, displayChildren }) => ({
    borderRadius: '1rem',
    border: 'solid 4px',
    textDecoration: 'none',
    outlineOffset: '6px',

    backgroundColor: theme.custom.postColors[post].light,
    borderColor: theme.custom.postColors[post].dark ?? theme.custom.box.borderColor,

    '&:hover': {
      '.list': {
        color: 'var(--primary-800)',
      },
    },

    '.displayChildren': {
      '.subPostContainer': {
        minHeight: displayChildren ? '0' : 'auto',
        height: displayChildren ? 'auto' : '0',
      },
    },
  }),
)
