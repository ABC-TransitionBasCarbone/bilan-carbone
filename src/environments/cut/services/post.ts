import { SubPost } from '@prisma/client'

type QuestionType = 'number' | 'boolean' | 'text' | 'select' | 'file'

export interface Question {
  key: string
  type: QuestionType
  importedEmissionFactorId: string
  value?: string
  options?: string[]
  depreciationPeriod?: boolean
}

export const subPostSubtitle: Partial<Record<SubPost, string>> = {
  [SubPost.Electromenager]: 'Electromenager',
}

export const subPostQuestions: Partial<Record<SubPost, Question[]>> = {
  [SubPost.Achats]: [],
  [SubPost.Fret]: [
    {
      key: 'FretProvenance',
      type: 'text',
      importedEmissionFactorId: '28026',
    },
  ],
  [SubPost.Electromenager]: [
    {
      key: 'Refrigerateurs',
      type: 'number',
      importedEmissionFactorId: '26976',
      depreciationPeriod: true,
    },
    {
      key: 'Congelateurs',
      type: 'number',
      importedEmissionFactorId: '26978',
      depreciationPeriod: true,
    },
    {
      key: 'Warmers',
      type: 'number',
      importedEmissionFactorId: '26986',
      depreciationPeriod: true,
    },
    {
      key: 'Distributeurs',
      type: 'number',
      importedEmissionFactorId: '26976',
      depreciationPeriod: true,
    },
  ],
}
