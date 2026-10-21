import { CourseOrganism } from '@abc-transitionbascarbone/common/db'
import { prismaClient } from './client.server'

export const createCourseOrganismList = (
  courseOrganisme: Pick<CourseOrganism, 'name' | 'contactEmail' | 'ftpPath'>[],
) =>
  prismaClient.courseOrganism.createMany({
    data: courseOrganisme,
  })
