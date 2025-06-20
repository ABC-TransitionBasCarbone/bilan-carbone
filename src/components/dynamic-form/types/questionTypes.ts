import { QuestionType } from '@prisma/client'

export { QuestionType, SubPost } from '@prisma/client'

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

export enum FieldType {
  TEXT = 'TEXT',
  NUMBER = 'NUMBER',
  BOOLEAN = 'BOOLEAN',
  SELECT = 'SELECT',
  TIME = 'TIME',
}

// Type mapping from Prisma QuestionType to our internal types
export const QUESTION_TYPE_FIELD_MAPPING: Record<QuestionType, FieldType> = {
  [QuestionType.TEXT]: FieldType.TEXT,
  [QuestionType.NUMBER]: FieldType.NUMBER,
  [QuestionType.SELECT]: FieldType.SELECT,
  [QuestionType.QCM]: FieldType.SELECT,
  [QuestionType.QCU]: FieldType.SELECT,
  [QuestionType.TABLE]: FieldType.TEXT,
  [QuestionType.POSTAL_CODE]: FieldType.TEXT,
  [QuestionType.DATE]: FieldType.TEXT,
  [QuestionType.RANGE]: FieldType.NUMBER,
  [QuestionType.PHONE]: FieldType.TEXT,
}
