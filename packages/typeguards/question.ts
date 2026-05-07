export type QuestionType = 'text' | 'choice' | 'number'

export interface BaseQuestion {
  id: string
  title: string
  type: QuestionType
  required?: boolean
  description?: string
}

export interface TextQuestion extends BaseQuestion {
  type: 'text'
  placeholder?: string
  validation?: {
    minLength?: number
    maxLength?: number
    pattern?: string
  }
}

export interface ChoiceQuestion extends BaseQuestion {
  type: 'choice'
  options: Array<{
    value: string
    label: string
  }>
  multiple?: boolean
}

export interface NumberQuestion extends BaseQuestion {
  type: 'number'
  placeholder?: string
  unit?: string
  validation?: {
    min?: number
    max?: number
    step?: number
  }
}

export type Question = TextQuestion | ChoiceQuestion | NumberQuestion

export interface Survey {
  id: string
  title: string
  description?: string
  questions: Question[]
  createdAt: Date
  updatedAt: Date
}

export interface SurveyResponse {
  surveyId: string
  responseId: string
  answers: Record<string, string | string[] | number>
  currentQuestionIndex: number
  completed: boolean
  startedAt: Date
  completedAt?: Date
  updatedAt: Date
}

export interface SurveyState {
  survey: Survey | null
  response: SurveyResponse | null
  currentQuestionIndex: number
  isLoading: boolean
  error: string | null
}
