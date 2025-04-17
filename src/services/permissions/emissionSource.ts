import { AccountWithUser } from '@/db/account'
import { getEmissionFactorById } from '@/db/emissionFactors'
import { OrganizationVersionWithOrganization } from '@/db/organization'
import { FullStudy, getStudyById } from '@/db/study'
import { getAccountRoleOnStudy } from '@/utils/study'
import { accountWithUserToUserSession } from '@/utils/userAccounts'
import { StudyEmissionSource, StudyRole } from '@prisma/client'
import { canBeValidated } from '../emissionSource'
import { Post, subPostsByPost } from '../posts'
import { canReadStudy, isAdminOnStudyOrga } from './study'

const hasStudyBasicRights = async (
  account: AccountWithUser,
  emissionSource: Pick<StudyEmissionSource, 'studyId' | 'subPost' | 'studySiteId'> & {
    emissionFactorId?: string | null
  },
  study: FullStudy,
) => {
  if (!(await canReadStudy(accountWithUserToUserSession(account), study.id))) {
    return false
  }

  if (!study.sites.find((site) => site.id === emissionSource.studySiteId)) {
    return false
  }

  const accountRoleOnStudy = getAccountRoleOnStudy(accountWithUserToUserSession(account), study)
  if (accountRoleOnStudy && accountRoleOnStudy !== StudyRole.Reader) {
    return true
  }

  return false
}

export const canCreateEmissionSource = async (
  account: AccountWithUser,
  emissionSource: Pick<StudyEmissionSource, 'studyId' | 'subPost' | 'studySiteId'> & {
    emissionFactorId?: string | null
  },
  study?: FullStudy,
) => {
  const dbStudy = study || (await getStudyById(emissionSource.studyId, account.organizationVersionId))
  if (!dbStudy) {
    return false
  }

  return hasStudyBasicRights(account, emissionSource, dbStudy)
}

export const canUpdateEmissionSource = async (
  account: AccountWithUser,
  emissionSource: StudyEmissionSource,
  change: Partial<StudyEmissionSource>,
  study: FullStudy,
) => {
  const hasBasicRights = await hasStudyBasicRights(account, emissionSource, study)
  if (!hasBasicRights) {
    const contributor = study.contributors.find(
      (contributor) =>
        contributor.account.user.email === account.user.email && contributor.subPost === emissionSource.subPost,
    )

    if (!contributor) {
      return false
    }
  }

  if (emissionSource.validated && change.validated !== false) {
    return false
  }

  if (change.validated !== undefined) {
    const rights = study.allowedUsers.find((right) => right.account.user.email === account.user.email)
    if (
      !isAdminOnStudyOrga(
        accountWithUserToUserSession(account),
        study.organizationVersion as OrganizationVersionWithOrganization,
      ) &&
      (!rights || rights.role !== StudyRole.Validator)
    ) {
      return false
    }

    if (change.validated === true && emissionSource.emissionFactorId) {
      const emissionFactor = await getEmissionFactorById(emissionSource.emissionFactorId)
      if (!canBeValidated({ ...emissionSource, ...change }, study, emissionFactor)) {
        return false
      }
    }
  }

  if (change.depreciationPeriod && !subPostsByPost[Post.Immobilisations].includes(emissionSource.subPost)) {
    return false
  }

  return true
}

export const canDeleteEmissionSource = async (account: AccountWithUser, study: FullStudy) => {
  const userRoleOnStudy = getAccountRoleOnStudy(accountWithUserToUserSession(account), study)
  if (userRoleOnStudy && userRoleOnStudy !== StudyRole.Reader) {
    return true
  }

  return false
}
