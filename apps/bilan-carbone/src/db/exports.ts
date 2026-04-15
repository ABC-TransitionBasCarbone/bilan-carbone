import { begesRules } from '@/utils/beges.config'
import { ghgpRules } from '@/utils/ghgp.config'
import type { PrismaClient } from '@repo/db-common'
import { Export } from '@repo/db-common/enums'

export const reCreateBegesRules = async (prismaClient: PrismaClient) => {
  await prismaClient.exportRule.deleteMany({ where: { export: Export.Beges } })
  await prismaClient.exportRule.createMany({ data: begesRules.map((rule) => ({ ...rule, export: Export.Beges })) })
}

export const reCreateGHGPRules = async (prismaClient: PrismaClient) => {
  await prismaClient.exportRule.deleteMany({ where: { export: Export.GHGP } })
  await prismaClient.exportRule.createMany({ data: ghgpRules.map((rule) => ({ ...rule, export: Export.GHGP })) })
}
