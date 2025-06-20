import { Question, QuestionType } from '@prisma/client'
import { z } from 'zod'
import { getInputFormat, getValidationRules } from '../services/questionService'
import { InputFormat } from '../types/questionTypes'
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
    case QuestionType.QCM:
    case QuestionType.QCU:
    case QuestionType.SELECT:
      schema = createSelectSchema(question)
      break
    case QuestionType.POSTAL_CODE:
      schema = createPostalCodeSchema()
      break
    case QuestionType.DATE:
      schema = createDateSchema()
      break
    case QuestionType.RANGE:
      schema = createNumberSchema(question)
      break
    case QuestionType.PHONE:
      schema = createPhoneSchema()
      break
    default:
      schema = z.string()
  }

  return question.required ? schema : schema.optional()
}

const createTextSchema = (question: Question): z.ZodString => {
  let schema = z.string()
  const format = getInputFormat(question.type)
  const validation = getValidationRules(question.type)

  switch (format) {
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

  if (validation) {
    if (validation.minLength || validation.maxLength) {
      const lengthSchema = createLengthValidation(validation.minLength, validation.maxLength)
      schema = schema.pipe(lengthSchema)
    }

    if (validation.pattern) {
      const patternSchema = createPatternValidation(validation.pattern, 'validation.pattern')
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
  const validation = getValidationRules(question.type)

  if (validation) {
    schema = createNumberRangeValidation(validation.min, validation.max)
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

const createPostalCodeSchema = (): z.ZodString => {
  return commonValidationRules.postalCode
}

const createDateSchema = (): z.ZodString => {
  return commonValidationRules.year
}

const createPhoneSchema = (): z.ZodString => {
  return commonValidationRules.phone
}
