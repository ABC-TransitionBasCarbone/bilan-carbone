'use client'
import { UseAutoSaveReturn } from '@/hooks/useAutoSave'
import { getQuestionsFromIdIntern } from '@/services/serverFunctions/question'
import { Question, QuestionType } from '@prisma/client'
import { useEffect, useState } from 'react'
import { Control, FieldError, FieldErrors, UseFormWatch } from 'react-hook-form'
import { FormValues, QuestionContainerProps } from '../types/formTypes'
import { FieldType } from '../types/questionTypes'
import {
  StyledQuestionAccordion,
  StyledQuestionAccordionDetails,
  StyledQuestionAccordionSummary,
} from './GroupQuestionAccordion.style'

import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown'
import { Card } from '@mui/material'
import FieldComponent from '../FieldComponent'
import { getQuestionFieldType } from '../services/questionService'
import { StyledCardContent, StyledCardHeader } from './Card/Card.style'

interface Props extends Omit<QuestionContainerProps, 'children'> {
  fieldType: FieldType
  fieldName: string
  question: Question
  error?: FieldError
  isLoading?: boolean
  control: Control<FormValues>
  watch: UseFormWatch<FormValues>
  formErrors: FieldErrors<FormValues>
  autoSave: UseAutoSaveReturn
}

const GroupQuestionAccordion = ({ question, error, control, watch, formErrors, autoSave, saveStatus }: Props) => {
  const [questions, setQuestions] = useState<Question[]>([])
  const getQuestions = async () => {
    const result = await getQuestionsFromIdIntern(question.idIntern)
    if (result.success) {
      setQuestions(result.data.filter(({ type }) => type !== QuestionType.TITLE))
    }
  }

  useEffect(() => {
    getQuestions()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [question.idIntern])

  return (
    <StyledQuestionAccordion defaultExpanded>
      <StyledQuestionAccordionSummary
        saveStatus={saveStatus}
        expandIcon={<KeyboardArrowDownIcon />}
        title={question.label}
      />
      <StyledQuestionAccordionDetails className="flex-col">
        {questions.map((question) => (
          <Card key={question.idIntern}>
            <StyledCardHeader subheader={question.label} />
            <StyledCardContent>
              <FieldComponent
                autoSave={autoSave}
                control={control}
                fieldName={question.idIntern}
                fieldType={getQuestionFieldType(question.type, question.unit)}
                formErrors={formErrors}
                question={question}
                watch={watch}
                error={error}
              />
            </StyledCardContent>
          </Card>
        ))}
      </StyledQuestionAccordionDetails>
    </StyledQuestionAccordion>
  )
}

export default GroupQuestionAccordion
