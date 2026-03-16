import { QuestionType } from '@prisma/client'
import { FieldType, NumberInputFormat, QUESTION_TYPE_FIELD_MAPPING, TextInputFormat } from '../types/questionTypes'

export const getTextInputFormat = (type: QuestionType): TextInputFormat => {
  switch (type) {
    case QuestionType.PHONE:
      return TextInputFormat.Phone
    default:
      return TextInputFormat.Text
  }
}

export const getNumberInputFormat = (type: QuestionType): NumberInputFormat => {
  switch (type) {
    case QuestionType.POSTAL_CODE:
      return NumberInputFormat.PostalCode
    default:
      return NumberInputFormat.Number
  }
}

export const getQuestionFieldType = (type: QuestionType, unit: string | null): FieldType => {
  if (type === QuestionType.TEXT && unit === 'YEAR') {
    return FieldType.YEAR
  }

  return QUESTION_TYPE_FIELD_MAPPING[type] || FieldType.TEXT
}
