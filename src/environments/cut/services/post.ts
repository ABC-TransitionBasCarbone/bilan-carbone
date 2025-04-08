import { SubPost } from '@prisma/client'

type QuestionType = 'number' | 'boolean' | 'text' | 'select' | 'file'

export interface Question {
  key: string
  type: QuestionType
  value?: string
  options?: string[]
}

export const subPostQuestions: Partial<Record<SubPost, Question[]>> = {
  [SubPost.Achats]: [
    {
      key: 'bonbons',
      value: '120',
      type: 'number',
    },
    {
      key: 'chips',
      value: '70',
      type: 'number',
    },
  ],
  [SubPost.Fret]: [
    {
      key: 'fret - cadence',
      type: 'number',
    },
    {
      key: 'fret - poids moyen',
      type: 'number',
    },
    {
      key: 'fret - provenance',
      type: 'text',
    },
  ],
}
