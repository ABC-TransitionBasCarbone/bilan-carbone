import { ReactNode } from 'react'
import { BaseInputProps } from '../types/formTypes'
import {
  StyledQuestionAccordion,
  StyledQuestionAccordionDetails,
  StyledQuestionAccordionSummary,
} from './QuestionAccondion.style'

interface GroupQuestionContainerProps extends BaseInputProps {
  children: ReactNode
}

const GroupQuestionContainer = ({ label, children }: GroupQuestionContainerProps) => {
  return (
    <StyledQuestionAccordion>
      <StyledQuestionAccordionSummary>{label}</StyledQuestionAccordionSummary>
      <StyledQuestionAccordionDetails>{children}</StyledQuestionAccordionDetails>
    </StyledQuestionAccordion>
  )
}

export default GroupQuestionContainer
