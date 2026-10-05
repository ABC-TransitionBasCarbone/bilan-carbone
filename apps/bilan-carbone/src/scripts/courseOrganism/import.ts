import { prismaClient } from '@/db/client.server'
import { createCourseOrganism } from '@/db/courseOrganism'
import { CourseOrganism } from '@abc-transitionbascarbone/db-common'
import { Command } from 'commander'
import { parse } from 'csv-parse'
import fs from 'fs'
import { getEncoding } from '../../utils/csv'

const addCourseOrganism = async (file: string) => {
  const existingOrganisms = await prismaClient.courseOrganism.findMany({})

  const createdOrganisms: Pick<CourseOrganism, 'name' | 'contactEmail' | 'ftpPath'>[] = []
  await new Promise<void>((resolve, reject) => {
    const stream = fs.createReadStream(file).pipe(
      parse({
        columns: (headers: string[]) => {
          if (!headers.includes('nom') || !headers.includes('contact') || !headers.includes('ftpPath')) {
            throw new Error(`Headers invalides ${headers.join(', ')}`)
          }
          return headers
        },
        delimiter: ';',
        encoding: getEncoding(file),
      }),
    )
    stream
      .on('data', (row: { nom: string; contact: string; ftpPath: string }) => {
        if (existingOrganisms.some((org) => org.name === row.nom)) {
          console.log(`L'organisme de formation "${row.nom}" existe déjà.`)
          return
        }

        createdOrganisms.push({
          name: row.nom,
          contactEmail: row.contact,
          ftpPath: row.ftpPath,
        })
      })
      .on('end', async () => {
        try {
          console.log(`Ajout de ${createdOrganisms.length} organismes de formation...`)
          await createCourseOrganism(createdOrganisms)
          console.log('Organismes de formations créés')
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
  .name('add-course-organism')
  .description('Script pour ajouter des OFs')
  .version('1.0.0')
  .requiredOption("-f, --file <value>', 'Fichier CSV avec les nouveaux OFs")
  .parse(process.argv)

const params = program.opts()

addCourseOrganism(params.file)
