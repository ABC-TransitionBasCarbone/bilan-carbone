import { FullStudy } from '@/db/study'
import { isAdminOnStudyOrga } from '@/services/permissions/study'
import { Role, StudyRole } from '@prisma/client'
import { User } from 'next-auth'

export const getUserRoleOnStudy = (user: User, study: FullStudy) => {
  if (isAdminOnStudyOrga(user, study)) {
    return StudyRole.Validator
  }
  if (study.isPublic && study.organizationId === user.organizationId) {
    return user.role === Role.DEFAULT ? StudyRole.Editor : StudyRole.Reader
  }
  const right = study.allowedUsers.find((right) => right.user.email === user.email)
  return right ? right.role : null
}
