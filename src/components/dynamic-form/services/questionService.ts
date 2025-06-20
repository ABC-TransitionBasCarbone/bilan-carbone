import { QuestionType } from '@prisma/client'
import { InputFormat, QUESTION_TYPE_FIELD_MAPPING } from '../types/questionTypes'

/**
 * Client-side utilities for question format and validation logic
 * Database operations are handled by server actions
 */

/**
 * Get input format based on question type
 */
export const getInputFormat = (type: QuestionType): InputFormat => {
  switch (type) {
    case QuestionType.POSTAL_CODE:
      return InputFormat.PostalCode
    case QuestionType.NUMBER:
    case QuestionType.RANGE:
      return InputFormat.Number
    case QuestionType.DATE:
      return InputFormat.Year
    case QuestionType.PHONE:
      return InputFormat.Phone
    case QuestionType.TEXT:
    default:
      return InputFormat.Text
  }
}

/**
 * Get validation rules based on question type
 */
export const getValidationRules = (type: QuestionType) => {
  switch (type) {
    case QuestionType.POSTAL_CODE:
      return {
        minLength: 5,
        maxLength: 5,
        pattern: '^[0-9]{5}$',
      }
    case QuestionType.NUMBER:
      return {
        min: 0,
      }
    case QuestionType.PHONE:
      return {
        pattern: '^[+]?[0-9\\\\s\\\\-\\\\(\\\\)]+$',
      }
    default:
      return undefined
  }
}

/**
 * Check if a question type should be treated as our internal types
 */
export const getQuestionFieldType = (prismaType: QuestionType): string => {
  return QUESTION_TYPE_FIELD_MAPPING[prismaType] || 'TEXT'
}