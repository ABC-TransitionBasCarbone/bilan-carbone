import { createQuestions } from '@/db/question'
import { getEncoding } from '@/utils/csv'
import { Prisma, SubPost, Type } from '@prisma/client'
import { Command } from 'commander'
import { parse } from 'csv-parse'
import fs from 'fs'

enum HEADERS {
  POSTES = 'Postes',
  SUBPOSTE = 'Sous-Postes',
  QUESTION = 'Question',
  ID_EMISSION_FACTOR = 'ID FE',
  TYPE = 'Type',
  ORDER = 'Ordre',
}

interface Header {
  Order: number
  Postes: string
  SubPost: SubPost
  Question: string
  IdEmmissionFactor: string
  Type: Type
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
          label: row.Question,
          subPost: row.SubPost,
          order: row.Order,
          type: row.Type,
          PossibleAnswers: JSON.stringify({}),
        })
      })
      .on('end', async () => {
        console.log()
        await createQuestions(questions)
        console.log()
        resolve()
      })
      .on('error', (error) => {
        reject(error)
      })
  })
}

const program = new Command()

program
  .name('questions')
  .description('Script pour importer les questions pour CUT')
  .version('1.0.0')
  .requiredOption('-n, --name <value>', 'Nom de la version')
  .option('-f, --file <value>', 'Import from CSV file')
  .parse(process.argv)

const params = program.opts()

addQuestions(params.file)
