import { getUserByEmail, getUserByEmailWithAllowedStudies, UserWithAllowedStudies } from '@/db/user'
import { Emission, Import, Prisma, Study } from '@prisma/client'
import { User } from 'next-auth'
import { checkLevel, checkOrganization } from './study'

export const NOT_AUTHORIZED = 'Not authorized'

export const checkPermission = {
  study: {
    read: async (user: User | UserWithAllowedStudies, study: Pick<Study, 'id' | 'organizationId' | 'isPublic'>) => {
      if (!user) {
        return false
      }

      if (study.isPublic) {
        if (await checkOrganization(user.organizationId, study.organizationId)) {
          return true
        }
      }

      let allowedStudies: Exclude<UserWithAllowedStudies, null>['allowedStudies']
      if ('allowedStudies' in user) {
        allowedStudies = user.allowedStudies
      } else {
        const userWithAllowedStudies = await getUserByEmailWithAllowedStudies(user.email)
        if (!userWithAllowedStudies) {
          return false
        }
        allowedStudies = userWithAllowedStudies.allowedStudies
      }

      if (allowedStudies.every((allowedStudy) => allowedStudy.studyId !== study.id)) {
        return false
      }
      return true
    },
    create: async (user: User, study: Prisma.StudyCreateInput, organizationId: string) => {
      const dbUser = await getUserByEmail(user.email)

      if (!dbUser) {
        return false
      }

      if (!checkLevel(dbUser.level, study.level)) {
        console.log('level')
        return false
      }

      if (!(await checkOrganization(dbUser.organizationId, organizationId))) {
        console.log('orga')
        return false
      }

      return true
    },
  },
  emission: {
    read: (user: User, emission: Pick<Emission, 'organizationId' | 'importedFrom'>) => {
      if (emission.importedFrom !== Import.Manual) {
        return true
      }

      return user.organizationId === emission.organizationId
    },
    create: () => {
      // For now everyone can create an FE
      return true
    },
  },
}
