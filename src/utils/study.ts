import { FullStudy } from '@/db/study'
import { isAdminOnStudyOrga } from '@/services/permissions/study'
import { StudyRole } from '@prisma/client'
import { User } from 'next-auth'

export const getUserRoleOnStudy = (user: User, study: FullStudy) => {
  if (isAdminOnStudyOrga(user, study)) {
    return StudyRole.Validator
  }
  const right = study.allowedUsers.find((right) => right.user.email === user.email)
  return right ? right.role : null
}
