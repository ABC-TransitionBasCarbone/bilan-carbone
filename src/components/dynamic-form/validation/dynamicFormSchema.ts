import { Question, QuestionType } from '@prisma/client'
import { useMemo } from 'react'
import { z } from 'zod'

export const createDynamicFormSchema = (questions: Question[]) => {
  const schemaObject: Record<string, z.ZodType> = {}

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

const createValidationRefine = (validationFn: (val: string) => boolean, message: string, required: boolean) => {
  return (val: string | undefined) => {
    if (!val || val.trim() === '') {
      return !required
    }
    return validationFn(val)
  }
}

const validationRules: Partial<Record<QuestionType, (val: string) => boolean>> = {
  [QuestionType.NUMBER]: (val: string) => !isNaN(parseFloat(val)),
  [QuestionType.POSTAL_CODE]: (val: string) => /^\d{5}$/.test(val),
  [QuestionType.DATE]: (val: string) => /^(0[1-9]|[12][0-9]|3[01])\/(0[1-9]|1[0-2])\/(19|20)\d{2}$/.test(val),
  [QuestionType.PHONE]: (val: string) => /^[+]?[\d\s\-()]+$/.test(val),
}

const validationMessages: Partial<Record<QuestionType, string>> = {
  [QuestionType.NUMBER]: 'number',
  [QuestionType.POSTAL_CODE]: 'postalCode',
  [QuestionType.DATE]: 'date',
  [QuestionType.PHONE]: 'phone',
}

export const createQuestionSchema = (question: Question) => {
  let schema: z.ZodType

  if (question.required) {
    schema = z
      .string({
        error: (issue) => (issue.input === undefined ? 'required' : 'required'),
      })
      .min(1, {
        error: 'required',
      })
  } else {
    schema = z
      .string({
        error: (issue) => (issue.input === undefined ? undefined : 'invalid_type'),
      })
      .optional()
      .or(z.literal(''))
  }

  const validationRule = validationRules[question.type]
  const validationMessage = validationMessages[question.type]

  if (validationRule && validationMessage) {
    schema = schema.refine(
      (val) => createValidationRefine(validationRule, validationMessage, question.required)(val as string),
      {
        message: validationMessage,
      },
    )
  }

  return schema
}
