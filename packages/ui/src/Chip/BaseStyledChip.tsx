'use client'

import { alpha, Chip, ChipProps, styled } from '@mui/material'

const BaseStyledChip = styled(Chip)(({ theme, color = 'default' }) => {
  const baseStyles = {
    maxWidth: '100%',
    height: 'auto',
    '--chip-background': alpha(theme.palette.grey[300], 0.6),
    '--chip-color': theme.palette.text.primary,
    '--chip-background-hover': alpha(theme.palette.grey[300], 0.8),
    backgroundColor: 'var(--chip-background) !important',
    color: 'var(--chip-color) !important',
    '& .MuiChip-label': {
      color: 'var(--chip-label-color, var(--chip-color)) !important',
    },
    '& .MuiChip-icon': {
      marginLeft: '0.5rem',
      color: 'var(--chip-icon-color, var(--chip-color)) !important',
    },
    '& .MuiChip-deleteIcon': {
      color: 'var(--chip-icon-color, var(--chip-color)) !important',
    },
    '&.MuiChip-clickable:hover': {
      backgroundColor: 'var(--chip-background-hover) !important',
    },
  }

  if (color === 'default') {
    return baseStyles
  }

  const palette = theme.palette[color as Exclude<typeof color, 'default'>]

  return {
    ...baseStyles,
    '--chip-background': palette.main,
    '--chip-color': palette.contrastText,
    '--chip-background-hover': alpha(palette.main, 0.6),
    backgroundColor: 'var(--chip-background) !important',
    color: 'var(--chip-color) !important',
    '& .MuiChip-label': {
      color: 'var(--chip-label-color, var(--chip-color)) !important',
    },
    '& .MuiChip-icon, & .MuiChip-deleteIcon': {
      color: 'var(--chip-icon-color, var(--chip-color)) !important',
    },
  }
})

export type { ChipProps }
export default BaseStyledChip
