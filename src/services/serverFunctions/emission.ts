'use server'

import { getUserByEmail } from '@/db/user'
import { auth } from '../auth'
import { CreateEmissionCommand } from './emission.command'
import { EmissionStatus, Import, Unit } from '@prisma/client'
import { getLocale } from '@/i18n/request'
import { prismaClient } from '@/db/client'
import { createEmission } from '@/db/emissions'
import { NOT_AUTHORIZED } from '../permissions/check'
import { canCreateEmission } from '../permissions/emission'

const getEmissionGazValue = (gaz: number[], multiple: boolean, postsCount: number) =>
  gaz.filter((_, i) => (multiple ? i < postsCount : i === 0)).reduce((acc: number, current: number) => acc + current, 0)

const getPostTotalCo2 = (gaz: number[][] = [], index: number) =>
  gaz.filter((g) => g !== undefined).reduce((acc, current) => acc + current[index] || 0, 0)

export const createEmissionCommand = async (
  {
    name,
    unit,
    attribute,
    comment,
    co2f = [],
    ch4f = [],
    ch4b = [],
    n2o = [],
    co2b = [],
    sf6 = [],
    hfc = [],
    pfc = [],
    otherGES = [],
    posts = [],
    subPost,
    ...command
  }: CreateEmissionCommand,
  multiple: boolean,
  postsCount: number,
) => {
  const session = await auth()
  const local = await getLocale()
  if (!session || !session.user) {
    return NOT_AUTHORIZED
  }

  const user = await getUserByEmail(session.user.email)

  if (!user) {
    return NOT_AUTHORIZED
  }

  if (!canCreateEmission()) {
    return NOT_AUTHORIZED
  }

  const gazData = {
    co2f: getEmissionGazValue(co2f, multiple, postsCount),
    ch4f: getEmissionGazValue(ch4f, multiple, postsCount),
    ch4b: getEmissionGazValue(ch4b, multiple, postsCount),
    n2o: getEmissionGazValue(n2o, multiple, postsCount),
    co2b: getEmissionGazValue(co2b, multiple, postsCount),
    sf6: getEmissionGazValue(sf6, multiple, postsCount),
    hfc: getEmissionGazValue(hfc, multiple, postsCount),
    pfc: getEmissionGazValue(pfc, multiple, postsCount),
    otherGES: getEmissionGazValue(otherGES, multiple, postsCount),
  }

  const emission = await createEmission({
    ...command,
    ...gazData,
    importedFrom: Import.Manual,
    status: EmissionStatus.Valid,
    reliability: 5,
    organization: { connect: { id: user.organizationId } },
    unit: unit as Unit,
    subPosts: [subPost],
    metaData: {
      create: {
        language: local,
        title: name,
        attribute,
        comment,
      },
    },
  })

  if (multiple) {
    await Promise.all(
      posts
        .filter((_, i) => (multiple ? i < postsCount : i === 0))
        .map((post, index) =>
          prismaClient.emissionPost.create({
            data: {
              emissionId: emission.id,
              type: post.type,
              co2f: co2f[index],
              ch4f: ch4f[index],
              ch4b: ch4b[index],
              n2o: n2o[index],
              co2b: co2b[index],
              sf6: sf6[index],
              hfc: hfc[index],
              pfc: pfc[index],
              otherGES: otherGES[index],
              totalCo2: getPostTotalCo2([co2f, ch4f, ch4b, n2o, co2b, sf6, hfc, pfc, otherGES], index),
              metaData: {
                create: {
                  language: local,
                  title: post.name,
                },
              },
            },
          }),
        ),
    )
  }
}
