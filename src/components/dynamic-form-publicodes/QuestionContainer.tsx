import { FieldSaveStatus } from '@/hooks/useAutoSave'
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
import SaveStatusIndicator from '../dynamic-form/SaveStatusIndicator'
import GlossaryModal from '../modals/GlossaryModal'

export interface QuestionContainerProps {
  label: string
  helperText?: string
  children: React.ReactNode
  // NOTE: how and when is it used?
  showResults?: boolean
  // results?: EmissionResults
  saveStatus?: FieldSaveStatus
}

const QuestionContainer = ({
  label,
  helperText,
  children,
  saveStatus = { status: 'saved' },
  /* showResults  results, saveStatus */
}: QuestionContainerProps) => {
  const tGlossary = useTranslations('questions.glossary')
  const [glossary, setGlossary] = useState('')

  return (
    <StyledQuestionContainer>
      <StyledQuestionHeader>
        <Box display="flex" alignItems="center" gap={1}>
          <StyledQuestionTitle>{label}</StyledQuestionTitle>
          {helperText && <HelpIcon className="ml-2" onClick={() => setGlossary('title')} label={tGlossary('title')} />}
        </Box>
        {saveStatus && <SaveStatusIndicator status={saveStatus} />}
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
