'use client'

import { emissionSourceTagColors } from '@/constants/emissionSourceTags'
import { Chip } from '@mui/material'
import classNames from 'classnames'
import styles from './TagChip.module.css'

interface Props {
  id?: string
  name: string
  color?: string | null
  size?: 'small' | 'medium'
  className?: string
  onClick?: () => void
  onDelete?: (event?: React.MouseEvent<HTMLDivElement>) => void
  'data-testid'?: string
}

const TagChip = ({
  id,
  name,
  color,
  size = 'medium',
  className,
  onClick,
  onDelete,
  'data-testid': dataTestId,
}: Props) => {
  const backgroundColor = color || emissionSourceTagColors.DEFAULT

  return (
    <Chip
      key={id}
      className={classNames(styles.tag, className)}
      size={size}
      onClick={onClick}
      onDelete={onDelete}
      data-testid={dataTestId}
      label={
        <div className="align-center gapped-2" style={{ minWidth: 0 }}>
          <div className={classNames(styles.colorCircle, 'flex-cc')} style={{ backgroundColor }} />
          <span className={styles.tagText}>{name}</span>
        </div>
      }
    />
  )
}

export default TagChip
