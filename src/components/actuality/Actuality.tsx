'use client'

import { Actuality } from '@prisma/client'
import classNames from 'classnames'
import DOMPurify from 'dompurify'
import { useFormatter, useTranslations } from 'next-intl'
import { useEffect, useState } from 'react'
import Box from '../base/Box'
import Button from '../base/Button'
import styles from './styles.module.css'

interface Props {
  actuality: Actuality
}

const ActualityRow = ({ actuality }: Props) => {
  const format = useFormatter()
  const t = useTranslations('actuality')
  const [expanded, setExpanded] = useState(false)
  const [cleanText, setCleanText] = useState('')
  const maxLength = 200

  const displayText = expanded
    ? actuality.text
    : `${actuality.text.slice(0, maxLength)}${actuality.text.length > maxLength ? '...' : ''}`

  useEffect(() => {
    setCleanText(DOMPurify.sanitize(displayText))
  }, [displayText])

  return (
    <li data-testid="actuality" className="flex-col">
      <Box className={classNames(styles.card, 'grow')}>
        <h3 className={classNames(styles.header, 'title-h5 flex')}>{actuality.title}</h3>
        <p className={classNames(styles.date, 'mb-2')}>
          {format.dateTime(actuality.updatedAt, {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
          })}
        </p>
        <p className={styles.text} dangerouslySetInnerHTML={{ __html: cleanText }} />

        {actuality.text.length > maxLength && (
          <div className="mt1">
            <Button color="secondary" onClick={() => setExpanded(!expanded)}>
              {expanded ? t('seeLess') : t('seeMore')}
            </Button>
          </div>
        )}
      </Box>
    </li>
  )
}

export default ActualityRow
