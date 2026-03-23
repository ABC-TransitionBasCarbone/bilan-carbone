import { createActualities } from '@/db/actuality.server'
import { Locale } from '@/i18n/config'
import type { Prisma } from '@repo/db-common'
import { Command } from 'commander'
import { parse } from 'csv-parse'
import fs from 'fs'
import { getEncoding } from '../../utils/csv'

const addActualities = async (file: string) => {
  const actualities: Prisma.ActualityCreateManyInput[] = []
  await new Promise<void>((resolve, reject) => {
    fs.createReadStream(file)
      .pipe(
        parse({
          columns: (headers: string[]) => {
            if (!headers.includes('Titre') || !headers.includes('Texte')) {
              throw new Error('Headers invalides, les colonnes Titre et Texte sont obligatoires')
            }
            return headers
          },
          delimiter: ';',
          encoding: getEncoding(file),
        }),
      )
      .on('data', (row: { Titre: string; Texte: string; Language?: string }) => {
        actualities.push({
          text: row.Texte,
          title: row.Titre,
          createdAt: new Date(),
          updatedAt: new Date(),
          language: row.Language || Locale.FR,
        })
      })
      .on('end', async () => {
        console.log(`Ajout de ${actualities.length} actualités...`)
        await createActualities(actualities)
        console.log('Actualités créées')
        resolve()
      })
      .on('error', (error) => {
        reject(error)
      })
  })
}

const program = new Command()

program
  .name('add-actualities')
  .description('Script pour ajouter des actualités')
  .version('1.0.0')
  .requiredOption("-f, --file <value>', 'Fichier CSV avec les actualités")
  .parse(process.argv)

const params = program.opts()

addActualities(params.file)
