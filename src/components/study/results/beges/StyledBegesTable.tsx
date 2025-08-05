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
      textAlign: 'center',
      verticalAlign: 'middle',
      backgroundColor: theme.palette.grey[100],

      // First row (main headers) - smaller text and gray
      '&:first-child': {
        fontSize: '0.875rem',
        color: theme.palette.grey[600],
      },

      // Second row (gas types) - smaller text
      '&:not(:first-child)': {
        fontSize: '0.875rem',
      },

      // Merged header cells (rowspan=2) - larger text and darker color
      '&[rowspan="2"]': {
        fontSize: '1rem',
        color: theme.palette.text.primary,
        fontWeight: 600,
      },
    },

    // First header row styling
    '& tr:first-child th': {
      fontSize: '0.875rem',
      color: theme.palette.grey[600],
      paddingBottom: '0.375rem',

      // Override for merged cells in first row
      '&[rowspan="2"]': {
        fontSize: '1rem',
        color: theme.palette.text.primary,
        paddingBottom: '0.75rem',
      },
    },

    // Second header row styling (gas types)
    '& tr:last-child th': {
      fontSize: '0.875rem',
      paddingTop: '0.375rem',
    },
  },

  '& tbody': {
    '& tr': {
      '& td': {
        padding: '0.5rem 1rem',
        borderBottom: '1px solid white',
        textAlign: 'center',
        verticalAlign: 'middle',

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

        '&.category-bold': {
          fontWeight: '600',
        },

        '&.subtotal-row': {
          fontWeight: '600',
        },

        '&.total-column': {
          fontWeight: '600',
        },

        ...Object.fromEntries(
          ([1, 2, 3, 4, 5, 6] as const).map((i) => [
            `&.category-cell[data-category="${i}"]`,
            { backgroundColor: theme.custom.beges.category[i] },
          ]),
        ),

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
