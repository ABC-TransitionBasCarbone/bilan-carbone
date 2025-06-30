import { Prisma, SubPost } from '@prisma/client'
import { parse } from 'csv-parse'
import fs from 'fs'
import { validateRow } from './utils'

type Delimiter = ',' | ';'

const enumMap = Object.values(SubPost).reduce(
  (map, value) => {
    const normalized = value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '')
      .trim()
    map[normalized] = value
    return map
  },
  {} as Record<string, SubPost>,
)

export async function parseCsv(file: string, delimiter: Delimiter): Promise<Prisma.QuestionCreateManyInput[]> {
  return new Promise((resolve, reject) => {
    const questions: Prisma.QuestionCreateManyInput[] = []
    const errors: string[] = []
    const existingIds = new Set<string>()
    let line = 2

    fs.createReadStream(file)
      .pipe(
        parse({
          columns: true,
          delimiter,
          trim: true,
        }),
      )
      .on('data', (row: Record<string, string>) => {
        const { error, data } = validateRow(row, line, existingIds, enumMap)

        if (error) {
          errors.push(error)
        } else if (data) {
          existingIds.add(data.idIntern)
          questions.push(data)
        }
        line++
      })
      .on('end', () => {
        if (errors.length > 0) {
          reject(new Error(errors.join('\n')))
        } else {
          resolve(questions)
        }
      })
      .on('error', (err) => {
        reject(err)
      })
  })
}
