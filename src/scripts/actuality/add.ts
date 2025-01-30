import { getEncoding } from '@/utils/csv'
import { Prisma } from '@prisma/client'
import { Command } from 'commander'
import { parse } from 'csv-parse'
import fs from 'fs'
import { prismaClient } from '../../db/client'

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
      .on('data', (row: { Titre: string; Texte: string }) => {
        actualities.push({ text: row.Texte, title: row.Titre, createdAt: new Date(), updatedAt: new Date() })
      })
      .on('end', async () => {
        console.log(`Ajout de ${actualities.length} actualités...`)
        await prismaClient.actuality.createMany({ data: actualities })
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
