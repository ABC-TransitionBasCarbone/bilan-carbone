import { AccountWithUser } from '@/db/account'
import { getEmissionFactorById } from '@/db/emissionFactors'
import { FullStudy, getStudyById, getStudySites } from '@/db/study'
import { getAccountRoleOnStudy, hasDeprecationPeriod } from '@/utils/study'
import { accountWithUserToUserSession } from '@/utils/userAccounts'
import { StudyEmissionSource, StudyRole } from '@prisma/client'
import { canBeValidated } from '../emissionSource'
import { canReadStudy, isAdminOnStudyOrga } from './study'

export const hasStudyBasicRights = async (account: AccountWithUser, study: FullStudy) => {
  if (!(await canReadStudy(accountWithUserToUserSession(account), study.id))) {
    return false
  }

  const accountRoleOnStudy = getAccountRoleOnStudy(accountWithUserToUserSession(account), study)
  if (accountRoleOnStudy && accountRoleOnStudy !== StudyRole.Reader) {
    return true
  }

  return false
}

type PartialStudyEmissionSource = Pick<StudyEmissionSource, 'studyId' | 'studySiteId'> & {
  emissionFactorId?: string | null
}
const canCreateEmissionSourceCommon = async (account: AccountWithUser, emissionSource: PartialStudyEmissionSource) => {
  const study = await getStudyById(emissionSource.studyId, account.organizationVersionId)
  if (!study) {
    return { allowed: false }
  }

  const studySites = await getStudySites(emissionSource.studyId)
  if (!studySites.some((studySite) => studySite.id === emissionSource.studySiteId)) {
    return { allowed: false }
  }

  return { allowed: true, study }
}

const canCreateEmissionSourceBC = async (account: AccountWithUser, emissionSource: PartialStudyEmissionSource) => {
  const { allowed, study } = await canCreateEmissionSourceCommon(account, emissionSource)
  if (!allowed || !study) {
    return false
  }

  return hasStudyBasicRights(account, study)
}

const canCreateEmissionSourceCUT = async (account: AccountWithUser, emissionSource: PartialStudyEmissionSource) => {
  const { allowed, study } = await canCreateEmissionSourceCommon(account, emissionSource)
  if (!allowed || !study) {
    return false
  }

  if (study.organizationVersionId !== account.organizationVersionId) {
    return false
  }

  return true
}

export const canCreateEmissionSource = async (account: AccountWithUser, emissionSource: PartialStudyEmissionSource) => {
  switch (account.environment) {
    case 'BC':
      return canCreateEmissionSourceBC(account, emissionSource)
    case 'TILT':
      return canCreateEmissionSourceBC(account, emissionSource)
    case 'CUT':
      return canCreateEmissionSourceCUT(account, emissionSource)
    case 'CLICKSON':
      return canCreateEmissionSourceCUT(account, emissionSource)
    default:
      return false
  }
}

const canUpdateEmissionSourceBC = async (
  account: AccountWithUser,
  emissionSource: StudyEmissionSource,
  change: Partial<StudyEmissionSource>,
  study: FullStudy,
) => {
  const canCreateEmissionSource = await canCreateEmissionSourceBC(account, emissionSource)
  if (!canCreateEmissionSource) {
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
      !isAdminOnStudyOrga(accountWithUserToUserSession(account), study.organizationVersion) &&
      (!rights || rights.role !== StudyRole.Validator)
    ) {
      return false
    }

    if (change.validated === true && emissionSource.emissionFactorId) {
      const emissionFactor = await getEmissionFactorById(emissionSource.emissionFactorId)
      if (!canBeValidated({ ...emissionSource, ...change }, study, emissionFactor, account.environment)) {
        return false
      }
    }
  }

  if (change.depreciationPeriod && !hasDeprecationPeriod(emissionSource.subPost)) {
    return false
  }

  return true
}

const canUpdateEmissionSourceCUT = (account: AccountWithUser, emissionSource: StudyEmissionSource) =>
  canCreateEmissionSourceCUT(account, emissionSource)

const canUpdateEmissionSourceClickson = async (
  account: AccountWithUser,
  emissionSource: StudyEmissionSource,
  study: FullStudy,
) => {
  const canCreateEmissionSource = await canCreateEmissionSourceCUT(account, emissionSource)
  if (!canCreateEmissionSource) {
    const contributor = study.contributors.find(
      (contributor) =>
        contributor.account.user.email === account.user.email && contributor.subPost === emissionSource.subPost,
    )

    if (!contributor) {
      return false
    }
    return true
  }
}

export const canUpdateEmissionSource = async (
  account: AccountWithUser,
  emissionSource: StudyEmissionSource,
  change: Partial<StudyEmissionSource>,
  study: FullStudy,
) => {
  switch (account.environment) {
    case 'BC':
      return canUpdateEmissionSourceBC(account, emissionSource, change, study)
    case 'TILT':
      return canUpdateEmissionSourceBC(account, emissionSource, change, study)
    case 'CUT':
      return canUpdateEmissionSourceCUT(account, emissionSource)
    case 'CLICKSON':
      return canUpdateEmissionSourceClickson(account, emissionSource, study)
    default:
      return false
  }
}

export const canDeleteEmissionSource = async (account: AccountWithUser, study: FullStudy) => {
  const userRoleOnStudy = getAccountRoleOnStudy(accountWithUserToUserSession(account), study)
  if (userRoleOnStudy && userRoleOnStudy !== StudyRole.Reader) {
    return true
  }

  return false
}
