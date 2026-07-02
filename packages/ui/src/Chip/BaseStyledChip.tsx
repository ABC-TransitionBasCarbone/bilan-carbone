'use client'

import { alpha, Chip, ChipProps, styled } from '@mui/material'

const BaseStyledChip = styled(Chip)(({ theme, color = 'default' }) => {
  const baseStyles = {
    maxWidth: '100%',
    height: 'auto',
    '& .MuiChip-icon': {
      marginLeft: '0.5rem',
    },
  }

  if (color === 'default') {
    return {
      ...baseStyles,
      color: theme.palette.text.primary,
      '& .MuiChip-icon, & .MuiChip-deleteIcon': {
        color: theme.palette.text.primary,
      },
      '&.MuiChip-clickable:hover': {
        backgroundColor: alpha(theme.palette.grey[300], 0.6),
      },
    }
  }

  const palette = theme.palette[color as Exclude<typeof color, 'default'>]

  return {
    ...baseStyles,
    color: palette.contrastText,
    '& .MuiChip-icon, & .MuiChip-deleteIcon': {
      color: palette.dark,
    },
    '&.MuiChip-clickable:hover': {
      backgroundColor: alpha(palette.main, 0.6),
    },
  }
})

export type { ChipProps }
export default BaseStyledChip
