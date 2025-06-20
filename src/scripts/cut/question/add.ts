import { createQuestions } from '@/db/question'
import { getEncoding } from '@/utils/csv'
import { Prisma, SubPost, Type } from '@prisma/client'
import { Command } from 'commander'
import { parse } from 'csv-parse'
import fs from 'fs'

enum HEADERS {
  ID_EMISSION_FACTOR = 'ID FE',
  ORDER = 'Ordre',
  POSSIBLEANSWERS = 'PossibleAnswers',
  POSTES = 'Postes',
  QUESTION = 'Question',
  SUBPOSTE = 'Sous-Postes',
  TYPE = 'Type',
  UNITE = 'Unité',
}

interface Header {
  IdEmmissionFactor: string
  Order: number
  PossibleAnswers: string
  Post: string
  Question: string
  SubPost: SubPost
  Type: Type
  Unite: string
}

const addQuestions = async (file: string) => {
  const questions: Prisma.QuestionCreateManyInput[] = []
  await new Promise<void>((resolve, reject) => {
    fs.createReadStream(file)
      .pipe(
        parse({
          columns: (headers: string[]) => {
            const expectedHeaders = Object.values(HEADERS)
            const missingHeaders = expectedHeaders.filter((h) => !headers.includes(h))

            if (missingHeaders.length > 0) {
              reject(new Error(`Headers manquants dans le fichier CSV : ${missingHeaders.join(', ')}`))
            }

            return headers
          },
          delimiter: ';',
          encoding: getEncoding(file),
        }),
      )
      .on('data', (row: Header) => {
        questions.push({
          idIntern: row.Question.replace(' ', '-'),
          label: row.Question,
          subPost: row.SubPost,
          order: row.Order,
          type: row.Type,
          possibleAnswers: row.PossibleAnswers.split('?'),
          unite: row.Unite,
        })
      })
      .on('end', async () => {
        console.log(`Ajout de ${questions.length} questions …`)
        await createQuestions(questions)
        console.log('Questions Créées')
        resolve()
      })
      .on('error', (error) => {
        reject(error)
      })
  })
}

const program = new Command()

program
  .name('add-questions')
  .description('Script pour importer les questions pour CUT')
  .version('1.0.0')
  .requiredOption('-n, --name <value>', 'Nom de la version')
  .option('-f, --file <value>', 'Import from CSV file')
  .parse(process.argv)

const params = program.opts()

addQuestions(params.file)
