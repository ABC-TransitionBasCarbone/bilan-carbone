import { Prisma } from '@prisma/client'
import { Command } from 'commander'
import { parse } from 'csv-parse'
import fs from 'fs'
import { getEncoding } from '../../utils/csv'
import { createCNC } from '@/db/cnc'

const addCNC = async (file: string) => {
  const cncs: Prisma.CNCCreateInput[] = []
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
      .on('data', (row: {
        regionCNC?: string
        numeroAuto?: string
        nom?: string
        adresse?: string
        commune?: string
        dep?: string
        ecrans?: number
        fauteuils?: number
        semainesActivite?: number
        seances?: number
        entrees2023?: number
        entrees2022?: number
        evolutionEntrees?: number
        trancheEntrees?: string
        genre?: string
        multiplexe?: string
        latitude?: number
        longitude?: number
      }) => {
        cncs.push({
          regionCNC: row.regionCNC,
          numeroAuto: row.numeroAuto,
          nom: row.nom,
          adresse: row.adresse,
          commune: row.commune,
          dep: row.dep,
          ecrans: row.ecrans ? parseInt(row.ecrans.toString(), 10) : undefined,
          fauteuils: row.fauteuils ? parseInt(row.fauteuils.toString(), 10) : undefined,
          semainesActivite: row.semainesActivite ? parseInt(row.semainesActivite.toString(), 10) : undefined,
          seances: row.seances ? parseInt(row.seances.toString(), 10) : undefined,
          entrees2023: row.entrees2023 ? parseInt(row.entrees2023.toString(), 10) : undefined,
          entrees2022: row.entrees2022 ? parseInt(row.entrees2022.toString(), 10) : undefined,
          evolutionEntrees: row.evolutionEntrees ? parseFloat(row.evolutionEntrees.toString()) : undefined,
          trancheEntrees: row.trancheEntrees,
          genre: row.genre,
          multiplexe: row.multiplexe === 'OUI',
          latitude: row.latitude ? parseFloat(row.latitude.toString()) : undefined,
          longitude: row.longitude ? parseFloat(row.longitude.toString()) : undefined,
        })
      })
      .on('end', async () => {
        console.log(`Ajout de ${cncs.length} cnc...`)
        await createCNC(cncs)
        console.log('CNC créées')
        resolve()
      })
      .on('error', (error) => {
        reject(error)
      })
  })
}

const program = new Command()

program
  .name('add-cnc')
  .description('Script pour ajouter des cnc')
  .version('1.0.0')
  .requiredOption("-f, --file <value>', 'Fichier CSV avec les cnc")
  .parse(process.argv)

const params = program.opts()

addCNC(params.file)
