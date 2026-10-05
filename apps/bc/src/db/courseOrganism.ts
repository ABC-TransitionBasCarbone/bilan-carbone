import { CourseOrganism } from '@abc-transitionbascarbone/common/db/enums'
import { prismaClient } from './client.server'

export const createCourseOrganism = (courseOrganisme: Pick<CourseOrganism, 'name' | 'contactEmail' | 'ftpPath'>[]) =>
  prismaClient.courseOrganism.createMany({
    data: courseOrganisme,
  })
