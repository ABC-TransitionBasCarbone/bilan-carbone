import { SubPost } from '@prisma/client'

type QuestionType = 'number' | 'boolean' | 'text' | 'select' | 'file'

export interface Question {
  key: string
  type: QuestionType
  importedEmissionFactorId: string
  value?: string
  options?: string[]
}

export const subPostQuestions: Partial<Record<SubPost, Question[]>> = {
  [SubPost.Achats]: [],
  [SubPost.Fret]: [
    {
      key: 'fret - provenance',
      type: 'text',
      importedEmissionFactorId: '28026',
    },
  ],
}
