import { SubPost } from '@prisma/client'

export enum QuestionType {
  Number = 'number',
  Boolean = 'boolean',
  Text = 'text',
  Select = 'select',
  File = 'file',
  QCM = 'qcm',
}

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
  importedEmissionFactorId?: string
  value?: string
  options?: string[]
}

export const subPostSubtitle: Partial<Record<SubPost, string>> = {
  [SubPost.Electromenager]: 'Electromenager',
}

export const subPostQuestions: Partial<Record<SubPost, Question[]>> = {
  [SubPost.Achats]: [
    {
      key: 'Renovation',
      type: QuestionType.QCM,
      options: ['total', 'extension', 'otherBigRenovation'],
    },
  ],
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
      type: QuestionType.Number,
      importedEmissionFactorId: '26976',
    },
    {
      key: 'Congelateurs',
      type: QuestionType.Number,
      importedEmissionFactorId: '26978',
    },
    {
      key: 'Warmers',
      type: QuestionType.Number,
      importedEmissionFactorId: '26986',
    },
    {
      key: 'Distributeurs',
      type: QuestionType.Number,
      importedEmissionFactorId: '26976',
    },
  ],
}
