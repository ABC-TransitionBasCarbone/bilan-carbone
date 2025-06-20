import { z } from 'zod'
import { InputFormat, QuestionType } from './questionTypes'

export type ValidationSchema = z.ZodSchema<unknown>

export interface ValidationContext {
  questionType: QuestionType
  format?: InputFormat
  required: boolean
  min?: number
  max?: number
  minLength?: number
  maxLength?: number
  pattern?: string
}

export interface ValidationError {
  field: string
  message: string
  code: string
}

export interface FormValidationResult {
  isValid: boolean
  errors: ValidationError[]
}

export type SchemaGenerator = (context: ValidationContext) => ValidationSchema
