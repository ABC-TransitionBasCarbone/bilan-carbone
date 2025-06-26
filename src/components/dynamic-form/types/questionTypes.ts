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
  SELECT_FE = 'SELECT_FE',
  DATE = 'DATE',
  YEAR = 'YEAR',
  TITLE = 'TITLE',
}

export const QUESTION_TYPE_FIELD_MAPPING: Record<QuestionType, FieldType> = {
  [QuestionType.TEXT]: FieldType.TEXT,
  [QuestionType.NUMBER]: FieldType.NUMBER,
  [QuestionType.SELECT]: FieldType.SELECT,
  [QuestionType.QCM]: FieldType.SELECT, // TODO: change when QCM is implemented
  [QuestionType.QCU]: FieldType.SELECT, // TODO: change when QCU is implemented
  [QuestionType.TABLE]: FieldType.TEXT, // TODO: change when table selector is implemented
  [QuestionType.POSTAL_CODE]: FieldType.NUMBER,
  [QuestionType.DATE]: FieldType.DATE,
  [QuestionType.RANGE]: FieldType.TEXT, // TODO: change when range selector is implemented
  [QuestionType.PHONE]: FieldType.TEXT,
  [QuestionType.SELECT_FE]: FieldType.SELECT_FE,
  [QuestionType.TITLE]: FieldType.TITLE,
}
