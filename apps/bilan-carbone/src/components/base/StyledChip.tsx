import { BaseStyledChip } from '@abc-transitionbascarbone/ui'
import { ChipProps, Tooltip } from '@mui/material'
import classNames from 'classnames'
import { useEffect, useRef, useState } from 'react'
import styles from './StyledChip.module.css'

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
      <span className={classNames('ellipsis', styles.title)}>{label}</span>
      {subtitle && <span className={classNames('ellipsis', styles.subtitle)}>{subtitle}</span>}
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
