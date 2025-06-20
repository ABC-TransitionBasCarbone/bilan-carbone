import { Question } from '@prisma/client'
import { useMemo } from 'react'
import { z } from 'zod'
import { ValidationSchema } from '../types/validationTypes'
import { createQuestionSchema } from './questionSchemas'

export const createDynamicFormSchema = (questions: Question[]): ValidationSchema => {
  const schemaObject: Record<string, ValidationSchema> = {}

  questions.forEach((question) => {
    schemaObject[question.idIntern] = createQuestionSchema(question)
  })

  return z.object(schemaObject)
}

export const useDynamicValidation = (questions: Question[]) => {
  return useMemo(() => {
    return createDynamicFormSchema(questions)
  }, [questions])
}

export const validateFormField = (value: unknown, question: Question): { isValid: boolean; error?: string } => {
  try {
    const schema = createQuestionSchema(question)
    schema.parse(value)
    return { isValid: true }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        isValid: false,
        error: error.errors[0]?.message || 'validation.invalid',
      }
    }
    return { isValid: false, error: 'validation.invalid' }
  }
}

export const validateFormValues = (
  formValues: Record<string, unknown>,
  questions: Question[],
): { isValid: boolean; errors: Record<string, string> } => {
  const schema = createDynamicFormSchema(questions)
  const result = schema.safeParse(formValues)

  if (result.success) {
    return { isValid: true, errors: {} }
  }

  const errors: Record<string, string> = {}
  result.error.errors.forEach((error) => {
    const fieldName = error.path[0] as string
    errors[fieldName] = error.message
  })

  return { isValid: false, errors }
}
