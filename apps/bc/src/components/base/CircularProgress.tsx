'use client'

import { CircularProgressProps } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import React from 'react'
import styles from './CircularProgress.module.css'

const SIZE = 44
const DEFAULT_THICKNESS = 3.6

const CircularProgress = React.forwardRef<HTMLSpanElement, CircularProgressProps>(
  (
    {
      color = 'primary',
      size = 40,
      thickness = DEFAULT_THICKNESS,
      value = 0,
      variant = 'indeterminate',
      className,
      ...rest
    },
    ref,
  ) => {
    const theme = useTheme()

    const colorMap: Record<string, string> = {
      primary: theme.palette.primary.main,
      secondary: theme.palette.secondary.main,
      error: theme.palette.error.main,
      info: theme.palette.info.main,
      success: theme.palette.success.main,
      warning: theme.palette.warning.main,
      inherit: 'currentColor',
    }

    const resolvedColor = (color && colorMap[color]) ?? colorMap.primary
    const circumference = 2 * Math.PI * ((SIZE - thickness) / 2)
    const dashoffset = variant === 'determinate' ? circumference * (1 - value / 100) : 0

    return (
      <span
        ref={ref}
        role="progressbar"
        aria-valuenow={variant === 'determinate' ? Math.round(value) : undefined}
        className={[styles.root, variant === 'indeterminate' ? styles.indeterminate : styles.determinate, className]
          .filter(Boolean)
          .join(' ')}
        data-size={typeof size === 'number' ? `${size}px` : size}
        data-color={resolvedColor}
        {...rest}
      >
        <svg viewBox={`0 0 ${SIZE} ${SIZE}`} className={styles.svg}>
          <circle
            className={[
              styles.circle,
              variant === 'indeterminate' ? styles.circleIndeterminate : styles.circleDeterminate,
            ]
              .filter(Boolean)
              .join(' ')}
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={(SIZE - thickness) / 2}
            fill="none"
            strokeWidth={thickness}
            stroke={resolvedColor}
            strokeDasharray={circumference}
            strokeDashoffset={dashoffset}
          />
        </svg>
      </span>
    )
  },
)

CircularProgress.displayName = 'CircularProgress'

export default CircularProgress
