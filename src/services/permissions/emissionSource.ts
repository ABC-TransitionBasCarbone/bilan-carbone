import { FullStudy, getStudyById } from '@/db/study'
import { Prisma, StudyEmissionSource, StudyRole, User } from '@prisma/client'
import { canReadStudy } from './study'

export const canCreateEmissionSource = async (
  user: User,
  emissionSource: Pick<StudyEmissionSource, 'studyId' | 'subPost'>,
  study?: FullStudy,
) => {
  const dbStudy = study || (await getStudyById(emissionSource.studyId))
  if (!dbStudy) {
    return false
  }

  if (!(await canReadStudy(user, dbStudy))) {
    return false
  }

  const rights = dbStudy.allowedUsers.find((right) => right.user.email === user.email)
  if (rights && rights.role !== StudyRole.Reader) {
    return true
  }

  const contributor = dbStudy.contributors.find(
    (contributor) => contributor.user.email === user.email && contributor.subPost === emissionSource.subPost,
  )
  if (contributor) {
    return true
  }

  return false
}

export const canUpdateEmissionSource = async (
  user: User,
  emissionSource: StudyEmissionSource,
  change: Prisma.StudyEmissionSourceUpdateInput,
  study: FullStudy,
) => {
  const canCreate = await canCreateEmissionSource(user, emissionSource, study)
  if (!canCreate) {
    return false
  }

  if (change.validated !== undefined) {
    const rights = study.allowedUsers.find((right) => right.user.email === user.email)
    if (!rights || rights.role !== StudyRole.Validator) {
      return false
    }
  }

  return true
}
