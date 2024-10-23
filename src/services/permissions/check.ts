import { getUserByEmail } from '@/db/user'
import { Prisma } from '@prisma/client'
import { User } from 'next-auth'
import { checkLevel, checkOrganization } from './study'

export const checkPermission = {
  study: {
    create: async (user: User, study: Prisma.StudyCreateInput, organizationId: string) => {
      const dbUser = await getUserByEmail(user.email)

      if (!dbUser) {
        return false
      }

      if (!checkLevel(dbUser.level, study.level)) {
        return false
      }

      if (!(await checkOrganization(dbUser.organizationId, organizationId))) {
        return false
      }

      return true
    },
  },
}
