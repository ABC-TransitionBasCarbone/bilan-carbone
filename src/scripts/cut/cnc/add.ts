import { upsertCNC } from '@/db/cnc'
import { Prisma } from '@prisma/client'
import { Command } from 'commander'
import { parse } from 'csv-parse'
import fs from 'fs'
import { getEncoding } from '../../../utils/csv'

const parseInteger = (value: string | number | undefined): number | undefined => {
  return value ? parseInt(value.toString().replace(/\s+/g, ''), 10) : undefined
}

const parseDecimal = (value: string | number | undefined): number | undefined => {
  return value ? parseFloat(value.toString().replace(/\s+/g, '')) : undefined
}

const addCNC = async (file: string) => {
  const cncs: Prisma.CncCreateInput[] = []
  await new Promise<void>((resolve, reject) => {
    fs.createReadStream(file)
      .pipe(
        parse({
          columns: (headers: string[]) => {
            headers = headers.map((h) =>
              h
                .trim()
                .normalize('NFD')
                .replace(/[\u0300-\u036f]/g, '') // remove accents
                .replace(/\s+/g, '') // remove spaces
                .replace(/[^a-zA-Z0-9]/g, '') // remove special chars
                .toLowerCase(),
            )
            const requiredHeaders = [
              'regioncnc',
              'nauto',
              'nom',
              'adresse',
              'codeinsee',
              'commune',
              'dep',
              'ecrans',
              'fauteuils',
              'semainesdactivite',
              'seances',
              'entrees2023',
              'entrees2022',
              'evolutionentrees',
              'tranchedentrees',
              'genre',
              'multiplexe',
              'latitude',
              'nombredefilmsprogrammes',
              'longitude',
            ]
            const missing = requiredHeaders.filter((h) => !headers.includes(h))
            if (missing.length > 0) {
              throw new Error(`Headers invalides, les colonnes suivantes sont obligatoires: ${missing.join(', ')}`)
            }
            return headers
          },
          delimiter: ';',
          encoding: getEncoding(file),
        }),
      )
      .on(
        'data',
        (row: {
          regioncnc?: string
          nauto?: string
          nom?: string
          adresse?: string
          codeinsee?: string
          commune?: string
          dep?: string
          ecrans?: number
          fauteuils?: number
          semainesdactivite?: number
          seances?: number
          entrees2023?: number
          entrees2022?: number
          evolutionentrees?: number
          tranchedentrees?: string
          genre?: string
          multiplexe?: string
          latitude?: number
          longitude?: number
          nombredefilmsprogrammes?: number
        }) => {
          cncs.push({
            regionCNC: row.regioncnc,
            numeroAuto: row.nauto,
            nom: row.nom,
            adresse: row.adresse,
            codeInsee: row.codeinsee,
            commune: row.commune,
            dep: row.dep,
            ecrans: parseInteger(row.ecrans),
            fauteuils: parseInteger(row.fauteuils),
            semainesActivite: parseInteger(row.semainesdactivite),
            seances: parseInteger(row.seances),
            entrees2023: parseInteger(row.entrees2023),
            entrees2022: parseInteger(row.entrees2022),
            evolutionEntrees: parseDecimal(row.evolutionentrees),
            trancheEntrees: row.tranchedentrees,
            genre: row.genre,
            multiplexe: row.multiplexe === 'OUI',
            latitude: parseDecimal(row.latitude),
            longitude: parseDecimal(row.longitude),
            numberOfProgrammedFilms: parseInteger(row.nombredefilmsprogrammes) || 0,
          })
        },
      )
      .on('end', async () => {
        console.log(`Ajout de ${cncs.length} cnc...`)
        await upsertCNC(cncs)
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
