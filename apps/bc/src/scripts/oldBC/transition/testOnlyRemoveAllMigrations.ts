import { prismaClient } from '@/db/client'
import { Command } from 'commander'

const removeAllMigrations = async () => {
  const emissionFactors = await prismaClient.emissionFactor.findMany({
    where: { oldBCId: { not: null } },
    select: { id: true },
  })
  const emissionFactorIds = emissionFactors.map((ef) => ef.id)

  const emissionFactorParts = await prismaClient.emissionFactorPart.findMany({
    where: { emissionFactorId: { in: emissionFactorIds } },
    select: { id: true },
  })
  const emissionFactorPartIds = emissionFactorParts.map((efp) => efp.id)

  await prismaClient.emissionFactorPartMetaData.deleteMany({
    where: { emissionFactorPartId: { in: emissionFactorPartIds } },
  })
  await prismaClient.emissionFactorPart.deleteMany({ where: { id: { in: emissionFactorPartIds } } })
  await prismaClient.emissionFactorMetaData.deleteMany({ where: { emissionFactorId: { in: emissionFactorIds } } })
  await prismaClient.emissionFactor.deleteMany({ where: { oldBCId: { not: null } } })

  const studies = await prismaClient.study.findMany({
    where: { oldBCId: { not: null } },
    select: { id: true },
  })
  const studyIds = studies.map((study) => study.id)

  await prismaClient.studyEmissionSource.deleteMany({ where: { studyId: { in: studyIds } } })
  await prismaClient.studySite.deleteMany({ where: { studyId: { in: studyIds } } })
  await prismaClient.studyExport.deleteMany({ where: { studyId: { in: studyIds } } })
  await prismaClient.studyEmissionFactorVersion.deleteMany({ where: { studyId: { in: studyIds } } })
  await prismaClient.study.deleteMany({ where: { id: { in: studyIds } } })

  const organizations = await prismaClient.organization.findMany({
    where: { oldBCId: { not: null } },
    select: { id: true },
  })
  const organizationIds = organizations.map((org) => org.id)

  await prismaClient.organizationVersion.deleteMany({ where: { organizationId: { in: organizationIds } } })

  await prismaClient.site.deleteMany({ where: { oldBCId: { not: null } } })
  await prismaClient.organization.deleteMany({ where: { oldBCId: { not: null } } })
}

const program = new Command()

program
  .name('test-only-remove-all-migrations')
  .description('UNIQUEMENT POUR LES TEST - Script pour supprimer tous les éléments de la migration')
  .version('1.0.0')
  .parse(process.argv)

removeAllMigrations()
