import { Box } from '@mui/material'
import { useTranslations } from 'next-intl'
import { useState } from 'react'
import HelpIcon from '../base/HelpIcon'
import {
  StyledQuestionContainer,
  StyledQuestionContent,
  StyledQuestionHeader,
  StyledQuestionTitle,
} from '../dynamic-form/QuestionContainer.styles'
import GlossaryModal from '../modals/GlossaryModal'

export interface QuestionContainerProps {
  label: string
  helperText?: string
  children: React.ReactNode
}

const QuestionContainer = ({ label, helperText, children }: QuestionContainerProps) => {
  const tGlossary = useTranslations('questions.glossary')
  const [glossary, setGlossary] = useState('')

  return (
    <StyledQuestionContainer>
      <StyledQuestionHeader>
        <Box className="align-center gapped1">
          <StyledQuestionTitle>{label}</StyledQuestionTitle>
          {helperText && <HelpIcon className="ml-2" onClick={() => setGlossary('title')} label={tGlossary('title')} />}
        </Box>
      </StyledQuestionHeader>

      <StyledQuestionContent>{children}</StyledQuestionContent>
      {glossary && (
        <GlossaryModal glossary="title" label="emission-factor-post" t={tGlossary} onClose={() => setGlossary('')}>
          {helperText}
        </GlossaryModal>
      )}
    </StyledQuestionContainer>
  )
}

export default QuestionContainer
