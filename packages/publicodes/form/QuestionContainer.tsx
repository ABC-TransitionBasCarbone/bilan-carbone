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
}

const QuestionContainer = ({ label, description, children }: QuestionContainerProps) => {
  const t = useTranslations('common')
  const [isDescriptionOpen, setIsDescriptionOpen] = useState(false)

  return (
    <StyledQuestionContainer>
      <StyledQuestionHeader>
        <Box className={classNames('align-center', 'gapped1')}>
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
        <div className={styles.descriptionBubble}>
          <p className={styles.descriptionText}>{description}</p>
          <button
            type="button"
            className={classNames(styles.closeButton, 'pointer')}
            onClick={() => setIsDescriptionOpen(false)}
          >
            {t('action.close')}
          </button>
        </div>
      )}

      <StyledQuestionContent>{children}</StyledQuestionContent>
    </StyledQuestionContainer>
  )
}

export { QuestionContainer }
