import { getEmissionFactorById } from '@/db/emissionFactors'
import { FullStudy, getStudyById } from '@/db/study'
import { StudyEmissionSource, StudyRole, User } from '@prisma/client'
import { canBeValidated } from '../emissionSource'
import { Post, subPostsByPost } from '../posts'
import { canReadStudy } from './study'

const hasStudyBasicRights = async (
  user: User,
  emissionSource: Pick<StudyEmissionSource, 'studyId' | 'subPost' | 'siteId'> & { emissionFactorId?: string | null },
  study: FullStudy,
) => {
  if (!(await canReadStudy(user, study))) {
    return false
  }

  if (!study.sites.find((site) => site.id === emissionSource.siteId)) {
    return false
  }

  if (emissionSource.emissionFactorId) {
    const emissionFactor = await getEmissionFactorById(emissionSource.emissionFactorId)
    if (!emissionFactor || !emissionFactor.subPosts.includes(emissionSource.subPost)) {
      return false
    }
  }

  const rights = study.allowedUsers.find((right) => right.user.email === user.email)
  if (rights && rights.role !== StudyRole.Reader) {
    return true
  }

  return false
}

export const canCreateEmissionSource = async (
  user: User,
  emissionSource: Pick<StudyEmissionSource, 'studyId' | 'subPost' | 'siteId'> & { emissionFactorId?: string | null },
  study?: FullStudy,
) => {
  const dbStudy = study || (await getStudyById(emissionSource.studyId, user.organizationId))
  if (!dbStudy) {
    return false
  }

  return hasStudyBasicRights(user, emissionSource, dbStudy)
}

export const canUpdateEmissionSource = async (
  user: User,
  emissionSource: StudyEmissionSource,
  change: Partial<StudyEmissionSource>,
  study: FullStudy,
) => {
  const hasBasicRights = await hasStudyBasicRights(user, emissionSource, study)
  if (!hasBasicRights) {
    const contributor = study.contributors.find(
      (contributor) => contributor.user.email === user.email && contributor.subPost === emissionSource.subPost,
    )

    if (!contributor) {
      return false
    }
  }

  if (emissionSource.validated && change.validated !== false) {
    return false
  }

  if (change.validated !== undefined) {
    const rights = study.allowedUsers.find((right) => right.user.email === user.email)
    if (!rights || rights.role !== StudyRole.Validator) {
      return false
    }

    if (change.validated === true && !canBeValidated({ ...emissionSource, ...change }, study)) {
      return false
    }
  }

  if (change.depreciationPeriod && !subPostsByPost[Post.Immobilisations].includes(emissionSource.subPost)) {
    return false
  }

  return true
}

export const canDeleteEmissionSource = async (user: User, study: FullStudy) => {
  const rights = study.allowedUsers.find((right) => right.user.email === user.email)
  if (rights && rights.role !== StudyRole.Reader) {
    return true
  }

  return false
}
