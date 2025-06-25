import { prismaClient } from '@/db/client'
import { Command } from 'commander'

const removeAllMigrations = async () => {
  await prismaClient.emissionFactorPartMetaData.deleteMany()
  await prismaClient.emissionFactorPart.deleteMany()
  await prismaClient.emissionFactorMetaData.deleteMany()
  await prismaClient.emissionFactor.deleteMany({ where: { oldBCId: { not: null } } })

  await prismaClient.organization.deleteMany({ where: { oldBCId: { not: null } } })
  await prismaClient.site.deleteMany({ where: { oldBCId: { not: null } } })
  await prismaClient.study.deleteMany({ where: { oldBCId: { not: null } } })
}

const program = new Command()

program
  .name('test-only-remove-all-migrations')
  .description('UNIQUEMENT POUR LES TEST - Script pour supprimer tous les éléments de la migration')
  .version('1.0.0')
  .parse(process.argv)

removeAllMigrations()
