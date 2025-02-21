import { FullStudy } from '@/db/study'
import { isAdminOnStudyOrga } from '@/services/permissions/study'
import { Post } from '@/services/posts'
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
}
