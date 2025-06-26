import { CUTUnit } from '@/services/unit'
import { Prisma, QuestionType, SubPost } from '@prisma/client'

export enum HEADERS {
  ID_EMISSION_FACTOR = 'ID FE',
  ORDER = 'Order',
  POSSIBLE_ANSWER = 'PossibleAnswers',
  POST = 'Postes',
  QUESTION = 'Question',
  REQUIRED = 'Required',
  SUB_POST = 'Sous-postes',
  TITRE = 'Titre',
  TYPE = 'Type',
  UNIT = 'Unité',
}

export interface Header {
  [HEADERS.ID_EMISSION_FACTOR]: string
  [HEADERS.ORDER]: string
  [HEADERS.POSSIBLE_ANSWER]: string
  [HEADERS.POST]: string
  [HEADERS.QUESTION]: string
  [HEADERS.REQUIRED]: boolean
  [HEADERS.SUB_POST]: string
  [HEADERS.TITRE]: string
  [HEADERS.TYPE]: string
  [HEADERS.UNIT]: CUTUnit
}

export const isValidEnumValue = <T extends Record<string, string>>(enumObj: T, value: string): value is T[keyof T] => {
  return Object.values(enumObj).includes(value)
}

export function normalizeLabel(label: string): string {
  return label
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '')
    .trim()
}

export const generateIdIntern = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')

export function checkRequiredField(
  field: string,
  name: HEADERS,
  context: Record<string, string>,
  line: number,
): string | undefined {
  if (!field || field === '') {
    const ctx = Object.entries(context)
      .map(([k, v]) => `${k} "${v}"`)
      .join(', ')
    return `(ligne ${line}) ${name} manquant, ${ctx}`
  }
}

export function validateRow(
  row: Record<string, string>,
  line: number,
  existingIds: Set<string>,
  enumMap: Record<string, SubPost>,
): { error?: string; data?: Prisma.QuestionCreateManyInput } {
  const titre = generateIdIntern(row[HEADERS.TITRE])
  const label = row[HEADERS.QUESTION]
  const type = row[HEADERS.TYPE] === '' ? QuestionType.TEXT : row[HEADERS.TYPE].toUpperCase()
  const unit = row[HEADERS.UNIT]
  const subPost = enumMap[normalizeLabel(row[HEADERS.SUB_POST])]

  const titreError = checkRequiredField(
    row[HEADERS.TITRE],
    HEADERS.TITRE,
    {
      [HEADERS.QUESTION]: label,
      [HEADERS.SUB_POST]: row[HEADERS.SUB_POST],
    },
    line,
  )
  if (titreError) {
    return { error: titreError }
  }

  if (existingIds.has(titre)) {
    return { error: `(ligne ${line}) Doublon de titre : "${titre}"` }
  }

  const labelError = checkRequiredField(
    label,
    HEADERS.QUESTION,
    {
      [HEADERS.ORDER]: row[HEADERS.ORDER],
      [HEADERS.SUB_POST]: row[HEADERS.SUB_POST],
    },
    line,
  )
  if (labelError) {
    return { error: labelError }
  }

  if (!isValidEnumValue(QuestionType, type)) {
    console.debug({ QuestionType, type })
    return { error: `(ligne ${line}) Type invalide "${type}", pour question "${label}"` }
  }

  if (unit && !isValidEnumValue(CUTUnit, unit)) {
    return { error: `(ligne ${line}) Unité invalide "${unit}" pour question "${label}"` }
  }

  if (!isValidEnumValue(SubPost, subPost)) {
    return {
      error:
        checkRequiredField(
          row[HEADERS.SUB_POST],
          HEADERS.SUB_POST,
          {
            [HEADERS.QUESTION]: label,
            [HEADERS.POST]: row[HEADERS.POST],
          },
          line,
        ) ?? `(ligne ${line}) Sous-poste invalide : "${row[HEADERS.SUB_POST]}"`,
    }
  }

  return {
    data: {
      idIntern: titre,
      label,
      subPost,
      order: Number(row[HEADERS.ORDER]),
      type,
      possibleAnswers: row[HEADERS.POSSIBLE_ANSWER].split('§').map((s) => s.trim()),
      unit: unit as CUTUnit,
      required: Boolean(row[HEADERS.REQUIRED]) || false,
    },
  }
}
