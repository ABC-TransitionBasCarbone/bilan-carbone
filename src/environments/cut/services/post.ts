import { SubPost } from '@prisma/client'

type QuestionType = 'number' | 'boolean' | 'text' | 'select' | 'file'

export enum InputFormat {
  Text = 'Text',
  PostalCode = 'PostalCode',
  Number = 'Number',
  Year = 'Year',
  Hour = 'Hour',
}

export enum InputCategory {
  Text = 'Text',
  Time = 'Time',
}

export const InputCategories: Record<InputFormat, InputCategory> = {
  [InputFormat.Text]: InputCategory.Text,
  [InputFormat.PostalCode]: InputCategory.Text,
  [InputFormat.Number]: InputCategory.Text,
  [InputFormat.Year]: InputCategory.Text,
  [InputFormat.Hour]: InputCategory.Time,
}

export interface Question {
  key: string
  type?: QuestionType
  format?: InputFormat
  importedEmissionFactorId: string
  value?: string
  options?: string[]
}

export const subPostSubtitle: Partial<Record<SubPost, string>> = {
  [SubPost.Electromenager]: 'Electromenager',
}

export const subPostQuestions: Partial<Record<SubPost, Question[]>> = {
  [SubPost.Achats]: [],
  [SubPost.Fret]: [
    {
      key: 'FretProvenance',
      importedEmissionFactorId: '28026',
      format: InputFormat.PostalCode,
    },
  ],
  [SubPost.Electromenager]: [
    {
      key: 'Refrigerateurs',
      type: 'number',
      importedEmissionFactorId: '26976',
    },
    {
      key: 'Congelateurs',
      type: 'number',
      importedEmissionFactorId: '26978',
    },
    {
      key: 'Warmers',
      type: 'number',
      importedEmissionFactorId: '26986',
    },
    {
      key: 'Distributeurs',
      type: 'number',
      importedEmissionFactorId: '26976',
    },
  ],
}
