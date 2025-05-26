import { alpha, Chip, ChipProps, styled } from '@mui/material'
import { JSX } from 'react'

const StyledChip = styled(Chip)(({ theme, color = 'default' }) => {
  if (color === 'default') {
    return {
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
    color: palette.dark,
    '& .MuiChip-icon, & .MuiChip-deleteIcon': {
      color: palette.dark,
    },
    '&.MuiChip-clickable:hover': {
      backgroundColor: alpha(palette.main, 0.6),
    },
  }
})

type PolymorphicChip = <C extends React.ElementType = 'div'>(props: ChipProps<C> & { component?: C }) => JSX.Element

export default StyledChip as PolymorphicChip
