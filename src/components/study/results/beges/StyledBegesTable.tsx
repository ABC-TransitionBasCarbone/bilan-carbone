'use client'

import { styled } from '@mui/material/styles'

export const StyledBegesTable = styled('table')(({ theme }) => ({
  width: '100%',
  borderCollapse: 'collapse',
  overflow: 'hidden',
  borderRadius: '0.25rem',
  boxShadow: 'none !important',

  '& thead': {
    '& th': {
      fontWeight: 600,
      padding: '0.75rem',
      textAlign: 'left',
      borderBottom: '1px solid white',
      backgroundColor: theme.palette.grey[100],
    },
  },

  '& tbody': {
    '& tr': {
      '& td': {
        padding: '0.5rem 1rem',
        borderBottom: '1px solid white',

        '&.total-row': {
          backgroundColor: theme.palette.grey[100],
          fontWeight: 600,
          borderTop: '0.5rem solid white',
        },

        '&.category-cell:not([data-category="total"])': {
          color: theme.palette.common.white,
          borderRight: '0.5rem solid white',
          fontWeight: '600',
        },

        ...Object.fromEntries(
          ([1, 2, 3, 4, 5, 6] as const).map((i) => [
            `&.category-cell[data-category="${i}"]`,
            { backgroundColor: theme.custom.beges.category[i] },
          ]),
        ),

        '&.category-cell[data-category="total"]': {
          backgroundColor: theme.palette.grey[100],
        },

        ...Object.fromEntries(
          ([1, 2, 3, 4, 5, 6] as const).map((i) => [
            `&.post-cell[data-category="${i}"]`,
            { backgroundColor: theme.custom.beges.categoryLight[i] },
          ]),
        ),

        '&:last-child': {
          paddingLeft: '0rem',
          paddingRight: '0rem',
        },
      },

      '&.category-first-row td': {
        borderTop: '0.5rem solid white',
      },
    },
  },
}))
