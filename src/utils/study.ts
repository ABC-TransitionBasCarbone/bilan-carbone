import { OrganizationVersionWithOrganization } from '@/db/organization'
import { FullStudy } from '@/db/study'
import { isAdminOnStudyOrga } from '@/services/permissions/study'
import { isAdmin } from '@/services/permissions/user'
import { Post } from '@/services/posts'
import { checkLevel } from '@/services/study'
import { Level, Role, StudyResultUnit, StudyRole } from '@prisma/client'
import { UserSession } from 'next-auth'
import { isInOrgaOrParent } from './organization'

export const getUserRoleOnPublicStudy = (user: UserSession, studyLevel: Level) => {
  if (isAdmin(user.role)) {
    return checkLevel(user.level, studyLevel) ? StudyRole.Validator : StudyRole.Reader
  }
  return user.role === Role.COLLABORATOR && checkLevel(user.level, studyLevel) ? StudyRole.Editor : StudyRole.Reader
}

export const getAccountRoleOnStudy = (user: UserSession, study: FullStudy) => {
  if (isAdminOnStudyOrga(user, study.organizationVersion as OrganizationVersionWithOrganization)) {
    return checkLevel(user.level, study.level) ? StudyRole.Validator : StudyRole.Reader
  }

  const right = study.allowedUsers.find((right) => right.account.id === user.accountId)
  if (right) {
    return right.role
  }

  if (
    study.isPublic &&
    isInOrgaOrParent(user.organizationVersionId, study.organizationVersion as OrganizationVersionWithOrganization)
  ) {
    return getUserRoleOnPublicStudy(user, study.level)
  }
  return null
}

export const colors: Record<string, { dark: string; light: string }> = {
  darkBlue: {
    dark: 'var(--post-darkBlue-dark)',
    light: 'var(--post-darkBlue-light)',
  },
  green: {
    dark: 'var(--post-green-dark)',
    light: 'var(--post-green-light)',
  },
  blue: {
    dark: 'var(--post-blue-dark)',
    light: 'var(--post-blue-light)',
  },
  orange: {
    dark: 'var(--post-orange-dark)',
    light: 'var(--post-orange-light)',
  },
}

export const postColors: Record<Post, string> = {
  [Post.Energies]: 'darkBlue',
  [Post.AutresEmissionsNonEnergetiques]: 'darkBlue',
  [Post.DechetsDirects]: 'darkBlue',
  [Post.Immobilisations]: 'darkBlue',
  [Post.IntrantsBiensEtMatieres]: 'blue',
  [Post.IntrantsServices]: 'blue',
  [Post.Deplacements]: 'green',
  [Post.Fret]: 'green',
  [Post.FinDeVie]: 'orange',
  [Post.UtilisationEtDependance]: 'orange',

  [Post.Fonctionnement]: 'darkBlue',
  [Post.MobiliteSpectateurs]: 'darkBlue',
  [Post.TourneesAvantPremiere]: 'darkBlue',
  [Post.SallesEtCabines]: 'darkBlue',
  [Post.ConfiseriesEtBoissons]: 'orange',
  [Post.Dechets]: 'darkBlue',
  [Post.BilletterieEtCommunication]: 'darkBlue',
}

export const hasEditionRights = (userRoleOnStudy: StudyRole | null) =>
  userRoleOnStudy && userRoleOnStudy !== StudyRole.Reader

export const STUDY_UNIT_VALUES: Record<StudyResultUnit, number> = {
  K: 1,
  T: 1000,
}

export const defaultStudyResultUnit = StudyResultUnit.T
