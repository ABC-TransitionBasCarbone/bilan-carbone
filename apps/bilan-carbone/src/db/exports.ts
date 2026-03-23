import { begesRules } from '@/utils/beges.config'
import { ghgpRules } from '@/utils/ghgp.config'
import { Export } from '@repo/db-common'
import { prismaClient } from './client.server'

export const reCreateBegesRules = async () => {
  await prismaClient.exportRule.deleteMany({ where: { export: Export.Beges } })
  await prismaClient.exportRule.createMany({ data: begesRules.map((rule) => ({ ...rule, export: Export.Beges })) })
}

export const reCreateGHGPRules = async () => {
  await prismaClient.exportRule.deleteMany({ where: { export: Export.GHGP } })
  await prismaClient.exportRule.createMany({ data: ghgpRules.map((rule) => ({ ...rule, export: Export.GHGP })) })
}
