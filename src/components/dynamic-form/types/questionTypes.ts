import { SubPost } from '@prisma/client'

export enum QuestionType {
  TEXT = 'text',
  NUMBER = 'number',
  BOOLEAN = 'boolean',
  SELECT = 'select',
  TIME = 'time',
}

export enum InputFormat {
  Text = 'Text',
  PostalCode = 'PostalCode',
  Number = 'Number',
  Year = 'Year',
  Hour = 'Hour',
  Email = 'Email',
  Phone = 'Phone',
}

export enum InputCategory {
  Text = 'Text',
  Time = 'Time',
  Select = 'Select',
  Boolean = 'Boolean',
  File = 'File',
}

export const InputCategories: Record<InputFormat, InputCategory> = {
  [InputFormat.Text]: InputCategory.Text,
  [InputFormat.PostalCode]: InputCategory.Text,
  [InputFormat.Number]: InputCategory.Text,
  [InputFormat.Year]: InputCategory.Text,
  [InputFormat.Hour]: InputCategory.Time,
  [InputFormat.Email]: InputCategory.Text,
  [InputFormat.Phone]: InputCategory.Text,
}

export interface ValidationRules {
  min?: number
  max?: number
  minLength?: number
  maxLength?: number
  pattern?: string
  customValidation?: string
}

export interface Question {
  id: string
  idIntern: string
  label: string
  order: number
  subPost: SubPost
  type: QuestionType
  unite: string
  possibleAnswers: string[]
  format?: InputFormat
  required?: boolean
  validation?: ValidationRules
  importedEmissionFactorId?: string
}

export interface Answer {
  id: string
  questionId: string
  studyId: string
  responses: string[]
  createdAt: Date
  updatedAt: Date
}
