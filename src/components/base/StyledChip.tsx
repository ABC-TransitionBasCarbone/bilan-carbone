import { alpha, Chip, ChipProps, styled, Tooltip } from '@mui/material'
import classNames from 'classnames'
import { useEffect, useRef, useState } from 'react'
import styles from './StyledChip.module.css'

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

type PolymorphicChipProps<C extends React.ElementType = 'div'> = ChipProps<C> & {
  component?: C
  subtitle?: string
  roleClass?: string
}

const StyledChip = <C extends React.ElementType = 'div'>({
  label,
  subtitle,
  roleClass,
  className,
  ...props
}: PolymorphicChipProps<C>) => {
  const [showTooltip, setShowTooltip] = useState(false)
  const chipRef = useRef<HTMLDivElement>(null)

  const finalLabel = (
    <div className={styles.labelContainer}>
      <span className={styles.title}>{label}</span>
      {subtitle && <span className={styles.subtitle}>{subtitle}</span>}
    </div>
  )

  useEffect(() => {
    if (chipRef.current && label) {
      const labelElement = chipRef.current.querySelector('.MuiChip-label')
      if (labelElement) {
        setShowTooltip(labelElement.scrollWidth > labelElement.clientWidth)
      }
    }
  }, [label])

  const chip = (
    <BaseStyledChip
      ref={chipRef}
      label={finalLabel}
      {...props}
      className={classNames(styles.chip, roleClass && styles[roleClass], className)}
    />
  )

  return showTooltip && label ? (
    <Tooltip title={label} arrow>
      {chip}
    </Tooltip>
  ) : (
    chip
  )
}

export default StyledChip
