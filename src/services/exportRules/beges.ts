import { Export } from '@prisma/client'
import { prismaClient } from '../../db/client'
import { begesRules } from './beges.config'

export const reCreateBegesRules = async () => {
  await prismaClient.exportRule.deleteMany({
    where: {
      export: Export.Beges,
    },
  })

  await prismaClient.exportRule.createMany({ data: begesRules.map((rule) => ({ ...rule, export: Export.Beges })) })
}
