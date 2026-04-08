import { getOrCreateCncVersion, upsertCNC } from '@/db/cnc'
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

const addCNC = async (file: string, year: number) => {
  const cncVersion = await getOrCreateCncVersion(year)
  console.log(`Using CNC version ${cncVersion.id} for year ${year}`)

  const cncs: (Prisma.CncCreateManyInput & { cncVersionId: string })[] = []
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
          entrees2024?: number
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
            cncVersionId: cncVersion.id,
            cncCode: `${row.regioncnc}${row.nauto}`,
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
            entrees2024: parseInteger(row.entrees2024),
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
        console.log(`Upserting ${cncs.length} CNC records with ${year} data...`)
        await upsertCNC(cncs)
        console.log(`✅ Successfully upserted CNC data for year ${year}`)
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
  .description('Script pour ajouter des cnc avec versioning par année')
  .version('1.0.0')
  .requiredOption('-f, --file <value>', 'Fichier CSV avec les cnc')
  .requiredOption('-y, --year <value>', 'Année des données CNC', parseInt)
  .parse(process.argv)

const params = program.opts<{
  file: string
  year: number
}>()

addCNC(params.file, params.year)
