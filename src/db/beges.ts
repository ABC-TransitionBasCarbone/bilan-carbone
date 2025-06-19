import { begesRules } from '@/utils/beges.config'
import { Export } from '@prisma/client'
import { prismaClient } from './client'

export const reCreateBegesRules = async () => {
  await prismaClient.exportRule.deleteMany({ where: { export: Export.Beges } })
  await prismaClient.exportRule.createMany({ data: begesRules.map((rule) => ({ ...rule, export: Export.Beges })) })
}
