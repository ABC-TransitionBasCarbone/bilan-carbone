import { createActualities } from '@/db/actuality.server'
import type { Prisma } from '@abc-transitionbascarbone/db-common'
import { Environment } from '@abc-transitionbascarbone/db-common/enums'
import { Locale } from '@abc-transitionbascarbone/i18n/config'
import { Command } from 'commander'
import { parse } from 'csv-parse'
import fs from 'fs'
import { getEncoding } from '../../utils/csv'

const addActualities = async (file: string) => {
  const actualities: Prisma.ActualityCreateManyInput[] = []
  await new Promise<void>((resolve, reject) => {
    const stream = fs.createReadStream(file).pipe(
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
    stream
      .on('data', (row: { Titre: string; Texte: string; Language?: string; Environment?: string }) => {
        const environment = row.Environment
          ? Object.values(Environment).find((value) => value === row.Environment)
          : Environment.BC

        if (!environment) {
          reject(new Error(`Environnement invalide : ${row.Environment}`))
          stream.destroy()
          return
        }

        actualities.push({
          text: row.Texte,
          title: row.Titre,
          createdAt: new Date(),
          updatedAt: new Date(),
          language: row.Language || Locale.FR,
          environment,
        })
      })
      .on('end', async () => {
        try {
          console.log(`Ajout de ${actualities.length} actualités...`)
          await createActualities(actualities)
          console.log('Actualités créées')
          resolve()
        } catch (error) {
          reject(error)
        }
      })
      .on('error', reject)
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
