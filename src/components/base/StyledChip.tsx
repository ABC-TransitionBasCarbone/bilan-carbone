import { alpha, Chip, ChipProps, styled, Tooltip } from '@mui/material'
import { useEffect, useRef, useState } from 'react'

const BaseStyledChip = styled(Chip)(({ theme, color = 'default' }) => {
  const baseStyles = {
    maxWidth: '100%',
    '& .MuiChip-label': {
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap',
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

type PolymorphicChipProps<C extends React.ElementType = 'div'> = ChipProps<C> & { component?: C }

const StyledChip = <C extends React.ElementType = 'div'>({ label, ...props }: PolymorphicChipProps<C>) => {
  const [showTooltip, setShowTooltip] = useState(false)
  const chipRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (chipRef.current && label) {
      const labelElement = chipRef.current.querySelector('.MuiChip-label')
      if (labelElement) {
        setShowTooltip(labelElement.scrollWidth > labelElement.clientWidth)
      }
    }
  }, [label])

  const chip = <BaseStyledChip ref={chipRef} label={label} {...props} />

  return showTooltip && label ? (
    <Tooltip title={label} arrow>
      {chip}
    </Tooltip>
  ) : (
    chip
  )
}

export default StyledChip
