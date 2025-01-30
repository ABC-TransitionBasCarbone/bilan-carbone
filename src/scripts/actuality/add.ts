import { Prisma } from '@prisma/client'
import { Command } from 'commander'
import { parse } from 'csv-parse'
import fs from 'fs'
import { prismaClient } from '../../db/client'

const addActualities = async (file: string) => {
  const buffer = fs.readFileSync(file, { encoding: 'binary' })
  /**
   * https://www.w3schools.com/charsets/ref_html_8859.asp
   * \xE8 and \xE9 are the hexadecimal codes for "è" (232) and "é" (233) in Latin-1 (ISO-8859-1).
   */
  const encoding = buffer.includes('\xE9') || buffer.includes('\xE8') ? 'latin1' : 'utf-8'
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
          encoding,
        }),
      )
      .on('data', (row: { Titre: string; Texte: string }) => {
        actualities.push({ text: row.Texte, title: row.Titre })
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
