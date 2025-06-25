import { QuestionType } from '@prisma/client'

export { QuestionType, SubPost } from '@prisma/client'

export enum TextInputFormat {
  Text = 'Text',
  Phone = 'Phone',
}

export enum NumberInputFormat {
  Number = 'Number',
  PostalCode = 'PostalCode',
}

export enum FieldType {
  TEXT = 'TEXT',
  NUMBER = 'NUMBER',
  SELECT = 'SELECT',
  DATE = 'DATE',
  YEAR = 'YEAR',
  QCM = 'QCM',
}

export const QUESTION_TYPE_FIELD_MAPPING: Record<QuestionType, FieldType> = {
  [QuestionType.TEXT]: FieldType.TEXT,
  [QuestionType.NUMBER]: FieldType.NUMBER,
  [QuestionType.SELECT]: FieldType.SELECT,
  [QuestionType.QCM]: FieldType.QCM,
  [QuestionType.QCU]: FieldType.SELECT, // TODO: change when QCU is implemented
  [QuestionType.TABLE]: FieldType.TEXT, // TODO: change when table selector is implemented
  [QuestionType.POSTAL_CODE]: FieldType.NUMBER,
  [QuestionType.DATE]: FieldType.DATE,
  [QuestionType.RANGE]: FieldType.TEXT, // TODO: change when range selector is implemented
  [QuestionType.PHONE]: FieldType.TEXT,
}
