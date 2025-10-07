'use client'

import { StudyTagColors } from '@/constants/studyTags'
import { Chip, ChipProps } from '@mui/material'
import classNames from 'classnames'
import styles from './TagChip.module.css'

interface Props {
  id?: string
  name: string
  color?: string | null
  className?: string
  'data-testid'?: string
}

const TagChip = ({
  id,
  name,
  color,
  className,
  'data-testid': dataTestId,
  ...props
}: Props & Omit<ChipProps, 'color'>) => {
  const backgroundColor = color || StudyTagColors.DEFAULT

  return (
    <Chip
      key={id}
      className={classNames(styles.tag, className)}
      data-testid={dataTestId}
      label={
        <div className="align-center gapped-2" style={{ minWidth: 0 }}>
          <div className={classNames(styles.colorCircle, 'flex-cc')} style={{ backgroundColor }} />
          <span className={styles.tagText}>{name}</span>
        </div>
      }
      {...props}
    />
  )
}

export default TagChip
