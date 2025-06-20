import { z } from 'zod'

export const commonValidationRules = {
  postalCode: z.string().regex(/^\d{5}$/, 'validation.postalCode'),
  year: z.string().regex(/^(19|20)\d{2}$/, 'validation.year'),
  email: z.string().email('validation.email'),
  phone: z.string().regex(/^[+]?[\d\s\-()]+$/, 'validation.phone'),
  positiveNumber: z.number().min(0, 'validation.positiveNumber'),
  requiredString: z.string().min(1, 'validation.required'),
  requiredNumber: z.number().min(0, 'validation.required'),
}

export const createLengthValidation = (min?: number, max?: number) => {
  let schema = z.string()
  if (min !== undefined) {
    schema = schema.min(min, `validation.minLength`)
  }
  if (max !== undefined) {
    schema = schema.max(max, `validation.maxLength`)
  }
  return schema
}

export const createNumberRangeValidation = (min?: number, max?: number) => {
  let schema = z.number()
  if (min !== undefined) {
    schema = schema.min(min, `validation.min`)
  }
  if (max !== undefined) {
    schema = schema.max(max, `validation.max`)
  }
  return schema
}

export const createPatternValidation = (pattern: string, errorKey: string) => {
  return z.string().regex(new RegExp(pattern), errorKey)
}
