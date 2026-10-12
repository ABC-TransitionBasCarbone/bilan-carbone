import { CourseOrganism, Prisma } from '@abc-transitionbascarbone/common/db'
import { Environment } from '@abc-transitionbascarbone/common/db/enums'
import { prismaClient } from './client'

export const createCourseOrganismList = (
  courseOrganisme: Pick<CourseOrganism, 'name' | 'contactEmail' | 'ftpPath'>[],
) =>
  prismaClient.courseOrganism.createMany({
    data: courseOrganisme,
  })

export const getCourseSessionsForTrainee = (
  accountId: string,
  environment: Environment,
  tx?: Prisma.TransactionClient,
) =>
  (tx ?? prismaClient).courseSession.findMany({
    where: {
      environment,
      traineeOrganizations: {
        some: {
          organizationVersion: {
            userAccounts: { some: { id: accountId } },
          },
        },
      },
    },
    select: { type: true },
    take: 2,
  })
