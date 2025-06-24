import { FormValues } from '@/components/dynamic-form/types/formTypes'
import { Answer, Question, QuestionType } from '@prisma/client'

export const answersToFormValues = (questions: Question[], answers?: Answer[]): FormValues => {
  const formValues: FormValues = {}

  questions.forEach((question) => {
    const answer = answers?.find((a) => a.questionId === question.id)

    if (answer && answer.response) {
      formValues[question.idIntern] = answer.response
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
