import { InputFormat, QuestionType } from '../types/questionTypes'

export interface ConversionContext {
  questionType: QuestionType
  format?: InputFormat
  possibleAnswers?: string[]
}

export class TypeConverter {
  static formValueToResponses(value: unknown, context: ConversionContext): string[] {
    if (value === undefined || value === null) {
      return []
    }

    switch (context.questionType) {
      case QuestionType.BOOLEAN:
        return [String(Boolean(value))]

      case QuestionType.NUMBER: {
        const numValue = Number(value)
        return isNaN(numValue) ? [] : [String(numValue)]
      }

      case QuestionType.SELECT:
        if (Array.isArray(value)) {
          return value.map((v) => String(v))
        }
        return value ? [String(value)] : []

      case QuestionType.TIME:
        return value ? [String(value)] : []

      case QuestionType.TEXT:
      default: {
        const strValue = String(value).trim()
        return strValue ? [strValue] : []
      }
    }
  }

  static responsesToFormValue(responses: string[], context: ConversionContext): unknown {
    if (!responses || responses.length === 0) {
      return this.getDefaultValue(context)
    }

    switch (context.questionType) {
      case QuestionType.BOOLEAN:
        return responses[0] === 'true'

      case QuestionType.NUMBER: {
        const numValue = Number(responses[0])
        return isNaN(numValue) ? undefined : numValue
      }

      case QuestionType.SELECT:
        if (context.possibleAnswers && context.possibleAnswers.length > 1) {
          // Multiple select
          return responses
        }
        // Single select
        return responses[0] || ''

      case QuestionType.TIME:
        return responses[0] || ''

      case QuestionType.TEXT:
      default:
        return responses[0] || ''
    }
  }

  static getDefaultValue(context: ConversionContext): unknown {
    switch (context.questionType) {
      case QuestionType.BOOLEAN:
        return false

      case QuestionType.NUMBER:
        return undefined

      case QuestionType.SELECT:
        if (context.possibleAnswers && context.possibleAnswers.length > 1) {
          return [] // Multiple select
        }
        return '' // Single select

      case QuestionType.TIME:
        return ''

      case QuestionType.TEXT:
      default:
        return ''
    }
  }

  static validateValue(value: string, context: ConversionContext): { isValid: boolean; error?: string } {
    switch (context.questionType) {
      case QuestionType.NUMBER:
        if (value !== undefined && value !== null && value !== '') {
          const numValue = Number(value)
          if (isNaN(numValue)) {
            return { isValid: false, error: 'Must be a valid number' }
          }
        }
        break

      case QuestionType.SELECT:
        if (context.possibleAnswers && value && !context.possibleAnswers.includes(value)) {
          return { isValid: false, error: 'Invalid selection' }
        }
        break

      case QuestionType.TEXT:
        if (context.format === InputFormat.PostalCode && value) {
          if (!/^\d{5}$/.test(value)) {
            return { isValid: false, error: 'Must be a 5-digit postal code' }
          }
        } else if (context.format === InputFormat.Year && value) {
          if (!/^\d{4}$/.test(value)) {
            return { isValid: false, error: 'Must be a 4-digit year' }
          }
        } else if (context.format === InputFormat.Email && value) {
          if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
            return { isValid: false, error: 'Must be a valid email address' }
          }
        }
        break
    }

    return { isValid: true }
  }
}
