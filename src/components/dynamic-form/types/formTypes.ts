import { SubPost } from '@prisma/client'
import { Control, FieldError } from 'react-hook-form'
import { FieldSaveStatus } from '../hooks/useAutoSave'
import { Answer, Question, QuestionType } from './questionTypes'

// TODO: Specify the possible types of the form values
export type FormValues = Record<string, unknown>

export interface DynamicFormProps {
  questions: Question[]
  subPost: SubPost
  studyId: string
  initialAnswers?: Answer[]
  isLoading?: boolean
}

export interface QuestionContainerProps {
  question: Question
  children: React.ReactNode
  isLoading?: boolean
  showResults?: boolean
  results?: EmissionResults
  saveStatus?: FieldSaveStatus
}

export interface DynamicFormFieldProps {
  question: Question
  control: Control<FormValues>
  error?: FieldError
  isLoading?: boolean
}

export interface BaseInputProps {
  question: Question
  value: unknown
  onChange: (value: unknown) => void
  onBlur: () => void
  error?: string
  disabled?: boolean
}

export interface TextFieldConfig {
  placeholder?: string
  multiline?: boolean
  rows?: number
}

export interface NumberFieldConfig {
  step?: number
  min?: number
  max?: number
}

export interface BooleanFieldConfig {
  trueLabel?: string
  falseLabel?: string
}

export interface SelectFieldConfig {
  multiple?: boolean
  options: Array<{ value: string; label: string }>
}

export interface FileFieldConfig {
  accept?: string
  multiple?: boolean
  maxSize?: number
}

export interface TimeFieldConfig {
  format?: '12h' | '24h'
  precision?: 'minute' | 'second'
}

export interface FormFieldMapping {
  [QuestionType.TEXT]: TextFieldConfig
  [QuestionType.NUMBER]: NumberFieldConfig
  [QuestionType.BOOLEAN]: BooleanFieldConfig
  [QuestionType.SELECT]: SelectFieldConfig
  [QuestionType.TIME]: TimeFieldConfig
}

export interface EmissionResults {
  emission: number
  qualityRating: string
  unit: string
}
