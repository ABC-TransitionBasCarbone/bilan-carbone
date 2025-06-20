import { createQuestions } from '@/db/question'
import { getEncoding } from '@/utils/csv'
import { Prisma, QuestionType, SubPost } from '@prisma/client'
import { Command } from 'commander'
import { parse } from 'csv-parse'
import fs from 'fs'
import path from 'path'

enum HEADERS {
  ID_EMISSION_FACTOR = 'ID FE',
  ORDER = 'Order',
  POSSIBLE_ANSWER = 'PossibleAnswers',
  POSTE = 'Postes',
  QUESTION = 'Question',
  REQUIRED = 'Required',
  SUB_POSTE = 'Sous-postes',
  TYPE = 'Type',
  UNITE = 'Unité',
}

interface Header {
  [HEADERS.ID_EMISSION_FACTOR]: string
  [HEADERS.ORDER]: string
  [HEADERS.POSSIBLE_ANSWER]: string
  [HEADERS.POSTE]: string
  [HEADERS.QUESTION]: string
  [HEADERS.REQUIRED]: boolean
  [HEADERS.SUB_POSTE]: string
  [HEADERS.TYPE]: string
  [HEADERS.UNITE]: string
}

const isValidEnumValue = <T extends Record<string, string>>(enumObj: T, value: string): value is T[keyof T] => {
  return Object.values(enumObj).includes(value)
}

const generateIdIntern = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')

const fileExists = (filePath: string) => fs.existsSync(filePath) && fs.statSync(filePath).isFile()

const parseCsv = async (file: string): Promise<Prisma.QuestionCreateManyInput[]> => {
  return new Promise((resolve, reject) => {
    const questions: Prisma.QuestionCreateManyInput[] = []
    const errors: string[] = []
    const encoding = getEncoding(file)

    fs.createReadStream(file, { encoding })
      .pipe(
        parse({
          columns: true,
          delimiter: ',',
          trim: true,
        }),
      )
      .on('data', (row: Header) => {
        const label = row[HEADERS.QUESTION]
        const type = row[HEADERS.TYPE] === '' ? QuestionType.TEXT : row[HEADERS.TYPE].toUpperCase()
        const subPost = row[HEADERS.SUB_POSTE]

        if (label === '') {
          errors.push(`Question manquante, Order "${row[HEADERS.ORDER]}", Sous postes "${row[HEADERS.SUB_POSTE]}"`)
          return
        }

        if (!isValidEnumValue(QuestionType, type)) {
          errors.push(`Type invalide: "${type}" pour la question "${label}"`)
          return
        }

        if (!isValidEnumValue(SubPost, subPost)) {
          errors.push(`Sous-poste invalide: "${subPost}" pour la question "${label}" au poste "${row[HEADERS.POSTE]}"`)
          return
        }

        questions.push({
          idIntern: generateIdIntern(`${subPost}-${label}`),
          label,
          subPost,
          order: Number(row[HEADERS.ORDER]),
          type,
          possibleAnswers: row[HEADERS.POSSIBLE_ANSWER].split('§').map((s) => s.trim()),
          unite: row[HEADERS.UNITE] || '',
          required: row[HEADERS.REQUIRED] || false,
        })
      })
      .on('end', () => {
        if (errors.length) {
          return reject(new Error(errors.join('\n')))
        }
        resolve(questions)
      })
      .on('error', reject)
  })
}

const addQuestions = async (file: string) => {
  if (!file || !fileExists(file)) {
    throw new Error(`Le fichier "${file}" est introuvable.`)
  }

  console.log(`📥 Lecture du fichier : ${file}`)

  const questions = await parseCsv(file)

  console.log(`📊 ${questions.length} questions prêtes à être insérées.`)

  await createQuestions(questions)

  console.log('✅ Insertion terminée.')
}

const program = new Command()

program
  .name('add-questions')
  .description('Script pour importer les questions pour CUT')
  .version('1.0.0')
  .requiredOption('-f, --file <value>', 'Import depuis un fichier CSV')
  .parse(process.argv)

const { file } = program.opts()

addQuestions(path.resolve(file)).catch((err) => {
  console.error('❌ Erreur :', err.message)
  process.exit(1)
})
