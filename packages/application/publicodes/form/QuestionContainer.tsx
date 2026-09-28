'use client'

import { InfoOutlined } from '@mui/icons-material'
import { Box, IconButton } from '@mui/material'
import classNames from 'classnames'
import { useTranslations } from 'next-intl'
import { useState } from 'react'
import {
  StyledQuestionContainer,
  StyledQuestionContent,
  StyledQuestionHeader,
  StyledQuestionTitle,
} from './QuestionContainer.styles'
import styles from './QuestionContainer.module.css'

export interface QuestionContainerProps {
  label: React.ReactNode
  description?: React.ReactNode
  children: React.ReactNode
  variant?: 'default' | 'flat'
}

const QuestionContainer = ({ label, description, children, variant = 'default' }: QuestionContainerProps) => {
  const t = useTranslations('common')
  const [isDescriptionOpen, setIsDescriptionOpen] = useState(false)
  const isFlat = variant === 'flat'

  return (
    <StyledQuestionContainer>
      <StyledQuestionHeader flat={isFlat}>
        <Box>
          <StyledQuestionTitle>{label}</StyledQuestionTitle>
        </Box>
        {description && (
          <IconButton
            size="small"
            onClick={() => setIsDescriptionOpen((open) => !open)}
            aria-label={t('moreInfo')}
            className={styles.infoButton}
          >
            <InfoOutlined fontSize="small" />
          </IconButton>
        )}
      </StyledQuestionHeader>

      {description && isDescriptionOpen && (
        <div className={classNames(styles.descriptionBubble, { [styles.descriptionBubbleNoTopBorder]: !isFlat })}>
          <p className={styles.descriptionText}>{description}</p>
          <button
            type="button"
            className={classNames(styles.closeButton, 'pointer', { [styles.closeButtonFlat]: isFlat })}
            onClick={() => setIsDescriptionOpen(false)}
          >
            {t('action.close')}
          </button>
        </div>
      )}

      <StyledQuestionContent flat={isFlat}>{children}</StyledQuestionContent>
    </StyledQuestionContainer>
  )
}

export { QuestionContainer }
