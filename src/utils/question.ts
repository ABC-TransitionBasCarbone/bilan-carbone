import { FormValues } from '@/components/dynamic-form/types/formTypes'
import { FieldType } from '@/components/dynamic-form/types/questionTypes'
import { Answer, Question, QuestionType } from '@prisma/client'
import { JsonObject } from '@prisma/client/runtime/library'

export const answersToFormValues = (questions: Question[], answers?: Answer[]): FormValues => {
  const formValues: FormValues = {}

  questions.forEach((question) => {
    const answer = answers?.find((a) => a.questionId === question.id)

    if (answer && answer.response) {
      if (/^\d+/.test(question.idIntern) && question.type !== FieldType.TABLE) {
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
