import { z } from 'zod'
import { InputFormat, Question, QuestionType } from '../types/questionTypes'
import { ValidationSchema } from '../types/validationTypes'
import {
  commonValidationRules,
  createLengthValidation,
  createNumberRangeValidation,
  createPatternValidation,
} from './validationRules'

export const createQuestionSchema = (question: Question): ValidationSchema => {
  let schema: ValidationSchema

  switch (question.type) {
    case QuestionType.TEXT:
      schema = createTextSchema(question)
      break
    case QuestionType.NUMBER:
      schema = createNumberSchema(question)
      break
    case QuestionType.BOOLEAN:
      schema = z.boolean()
      break
    case QuestionType.SELECT:
      schema = createSelectSchema(question)
      break
    case QuestionType.FILE:
      schema = createFileSchema()
      break
    case QuestionType.TIME:
      schema = createTimeSchema(question)
      break
    default:
      schema = z.string()
  }

  return question.required ? schema : schema.optional()
}

const createTextSchema = (question: Question): z.ZodString => {
  let schema = z.string()

  if (question.format) {
    switch (question.format) {
      case InputFormat.PostalCode:
        schema = commonValidationRules.postalCode
        break
      case InputFormat.Year:
        schema = commonValidationRules.year
        break
      case InputFormat.Email:
        schema = commonValidationRules.email
        break
      case InputFormat.Phone:
        schema = commonValidationRules.phone
        break
      case InputFormat.Number:
        schema = z.string().regex(/^\d+$/, 'validation.numberFormat')
        break
      case InputFormat.Text:
      default:
        schema = z.string()
        break
    }
  }

  if (question.validation) {
    if (question.validation.minLength || question.validation.maxLength) {
      const lengthSchema = createLengthValidation(question.validation.minLength, question.validation.maxLength)
      schema = schema.pipe(lengthSchema)
    }

    if (question.validation.pattern) {
      const patternSchema = createPatternValidation(question.validation.pattern, 'validation.pattern')
      schema = schema.pipe(patternSchema)
    }
  }

  if (question.required) {
    schema = schema.min(1, 'validation.required')
  }

  return schema
}

const createNumberSchema = (question: Question): z.ZodNumber => {
  let schema = z.number()

  if (question.validation) {
    schema = createNumberRangeValidation(question.validation.min, question.validation.max)
  }

  if (question.required) {
    schema = schema.min(0, 'validation.required')
  }

  return schema
}

const createSelectSchema = (question: Question): z.ZodUnion<[z.ZodString, ...z.ZodString[]]> | z.ZodString => {
  const validOptions = question.possibleAnswers

  if (validOptions.length === 0) {
    return z.string()
  }

  const optionSchema = z.enum(validOptions as [string, ...string[]])

  return optionSchema
}

const createFileSchema = (): z.ZodUnknown => {
  return z.unknown()
}

const createTimeSchema = (question: Question): z.ZodString => {
  let schema = z.string()

  if (question.format === InputFormat.Hour) {
    schema = z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'validation.timeFormat')
  }

  if (question.required) {
    schema = schema.min(1, 'validation.required')
  }

  return schema
}
