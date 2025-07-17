import { upsertQuestions } from '@/db/question'
import { Command } from 'commander'
import fs from 'fs'
import path from 'path'
import { parseCsv } from './parser'

const fileExists = (filePath: string) => fs.existsSync(filePath) && fs.statSync(filePath).isFile()

const program = new Command()

program
  .name('add-questions')
  .description('Script pour importer les questions pour CUT')
  .version('1.0.0')
  .option(
    '-s, --source <type>',
    'Source du fichier CSV (excel | google)',
    (value) => {
      const allowed = ['google', 'excel']
      if (!allowed.includes(value)) {
        throw new Error(`Source invalide : "${value}". Choix possibles : ${allowed.join(', ')}`)
      }
      return value
    },
    'excel',
  )
  .requiredOption('-f, --file <value>', 'Import depuis un fichier CSV')
  .parse(process.argv)

const { file, source } = program.opts()

async function addQuestions(file: string, source: string) {
  if (!file || !fileExists(file)) {
    throw new Error(`Le fichier "${file}" est introuvable.`)
  }

  console.log(`📥 Lecture du fichier : ${file}`)

  const questions = await parseCsv(file, source === 'excel' ? ';' : ',')

  console.log(`📊 ${questions.length} questions prêtes à être insérées.`)

  await upsertQuestions(questions)

  console.log('✅ Insertion terminée.')
}

addQuestions(path.resolve(file), source).catch((err) => {
  console.error('❌ Erreur : \n', err.message)
  process.exit(1)
})
