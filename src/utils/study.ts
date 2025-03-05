import { FullStudy } from '@/db/study'
import { isAdminOnStudyOrga } from '@/services/permissions/study'
import { Post } from '@/services/posts'
import { checkLevel } from '@/services/study'
import { Role, StudyRole } from '@prisma/client'
import { User } from 'next-auth'
import { isInOrgaOrParent } from './onganization'

export const getUserRoleOnStudy = (user: User, study: FullStudy) => {
  if (isAdminOnStudyOrga(user, study)) {
    return StudyRole.Validator
  }

  const right = study.allowedUsers.find((right) => right.user.email === user.email)
  if (right) {
    return right.role
  }

  if (study.isPublic && isInOrgaOrParent(user.organizationId, study.organization)) {
    return user.role === Role.DEFAULT && checkLevel(user.level, study.level) ? StudyRole.Editor : StudyRole.Reader
  }
  return null
}

export const colors: Record<string, { dark: string; light: string }> = {
  darkBlue: {
    dark: 'var(--primary-800)',
    light: 'var(--primary2-200)',
  },
  green: {
    dark: 'var(--secondary2-700)',
    light: 'var(--secondary2-400)',
  },
  blue: {
    dark: 'var(--primary2-300)',
    light: 'var(--primary2-200)',
  },
  orange: {
    dark: 'var(--warning-400)',
    light: 'var(--warning-300)',
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
}

export const hasEditionRights = (userRoleOnStudy: StudyRole | null) =>
  userRoleOnStudy && userRoleOnStudy !== StudyRole.Reader
