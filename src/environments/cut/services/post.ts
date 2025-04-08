import { SubPost } from '@prisma/client'

type QuestionType = 'number' | 'boolean' | 'text' | 'select' | 'file'

export interface Question {
  key: string
  label: string
  type: QuestionType
  options?: string[]
}

export const subPostQuestions: Partial<Record<SubPost, Question[]>> = {
  [SubPost.Achats]: [
    {
      key: 'bonbons',
      label: 'Bonbons - Nombre (sachets de 120g)',
      type: 'number',
    },
    {
      key: 'chips',
      label: 'Chips - Nombre (sachets de 70g)',
      type: 'number',
    },
  ],
}
