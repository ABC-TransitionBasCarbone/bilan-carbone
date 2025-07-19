import { Environment } from '@prisma/client'
import { Command } from 'commander'
import { prismaClient } from '../../db/client'

const program = new Command()

program.name('fix-cnc').description('Script pour réparer le problèmes des CNCs').version('1.0.0').parse(process.argv)

const fixCNCs = async () => {
  const orgaVersions = await prismaClient.organizationVersion.findMany({
    where: {
      environment: Environment.CUT,
    },
  })

  const sites = await prismaClient.site.findMany({
    where: { organizationId: { in: orgaVersions.map((v) => v.organizationId) } },
  })

  const cncIds = await prismaClient.cnc.findMany({})

  for (const site of sites) {
    const cnc = cncIds.find((c) => c.id === site.cncId)
    if (!site.cncId || !cnc) {
      console.log(`CNC not found for site ${site.id}, putting random CNC`)
      await prismaClient.site.update({ where: { id: site.id }, data: { cncId: cncIds[0].id } })
    } else {
      console.log(`CNC with ID ${cnc.id} found for site ${site.id}, no action needed.`)
    }
  }
}

fixCNCs()
