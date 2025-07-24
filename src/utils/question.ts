import { FormValues } from '@/components/dynamic-form/types/formTypes'
import { FieldType } from '@/components/dynamic-form/types/questionTypes'
import { EmissionFactorInfo } from '@/constants/emissionFactorMap'
import { ID_INTERN_PREFIX_REGEX } from '@/constants/utils'
import { Answer, Question, QuestionType } from '@prisma/client'
import { JsonObject } from '@prisma/client/runtime/library'

export const answersToFormValues = (questions: Question[], answers?: Answer[]): FormValues => {
  const formValues: FormValues = {}

  questions.forEach((question) => {
    const answer = answers?.find((a) => a.questionId === question.id)

    if (answer && answer.response) {
      if (ID_INTERN_PREFIX_REGEX.test(question.idIntern) && question.type !== FieldType.TABLE) {
        const keys = Object.keys(answer.response as JsonObject)
        keys.forEach((key) => {
          formValues[`${question.idIntern}-${key}`] = (answer.response as JsonObject)[key]
        })
      } else {
        formValues[question.idIntern] = answer.response
      }
    } else {
      formValues[question.idIntern] = null
    }
  })

  return formValues
}

export const getQuestionLabel = (questionType: QuestionType, tFormat: (slug: string) => string) => {
  switch (questionType) {
    case QuestionType.POSTAL_CODE:
      return tFormat('postalCode')
    case QuestionType.PHONE:
      return tFormat('phone')
    default:
      return ''
  }
}

export const isQuestionRelatedToPrevious = (
  currentQuestionInfo: EmissionFactorInfo,
  previousQuestion: Question,
): boolean => {
  if (!currentQuestionInfo?.conditionalRules || currentQuestionInfo.conditionalRules.length === 0) {
    return false
  }

  return currentQuestionInfo.conditionalRules.some((rule) => rule.idIntern === previousQuestion.idIntern)
}

export const areQuestionsLinked = (
  currentQuestionInfo: EmissionFactorInfo,
  previousQuestion: Question,
  previousQuestionInfo: EmissionFactorInfo | null,
): boolean => {
  // Direct parent-child relationship (current question depends on previous question)
  if (currentQuestionInfo && isQuestionRelatedToPrevious(currentQuestionInfo, previousQuestion)) {
    return true
  }

  // Sibling relationship - when multiple questions depend on the same parent
  if (
    currentQuestionInfo?.conditionalRules &&
    currentQuestionInfo.conditionalRules.length > 0 &&
    previousQuestionInfo?.conditionalRules &&
    previousQuestionInfo.conditionalRules.length > 0
  ) {
    const hasSharedParent = currentQuestionInfo.conditionalRules.some((currentRule) =>
      previousQuestionInfo.conditionalRules?.some((previousRule) => currentRule.idIntern === previousRule.idIntern),
    )
    if (hasSharedParent) {
      return true
    }
  }

  return false
}
