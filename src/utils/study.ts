import { OrganizationVersionWithOrganization } from '@/db/organization'
import { FullStudy } from '@/db/study'
import { isAdminOnStudyOrga } from '@/services/permissions/study'
import { Post, subPostsByPost } from '@/services/posts'
import { ResultsByPost } from '@/services/results/consolidated'
import { checkLevel } from '@/services/study'
import { isAdmin } from '@/utils/user'
import { Environment, Level, Role, StudyResultUnit, StudyRole, SubPost, Unit } from '@prisma/client'
import { UserSession } from 'next-auth'
import { formatNumber } from './number'
import { isInOrgaOrParent } from './organization'

export const getUserRoleOnPublicStudy = (
  user: Pick<UserSession, 'role' | 'level' | 'environment'>,
  studyLevel: Level,
) => {
  if (isAdmin(user.role)) {
    return checkLevel(user.level, studyLevel) ? StudyRole.Validator : StudyRole.Reader
  }

  if (user.environment === Environment.CUT) {
    return StudyRole.Editor
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

export const getAllowedRolesFromDefaultRole = (role: StudyRole) => {
  switch (role) {
    case StudyRole.Validator:
      return [StudyRole.Validator]
    case StudyRole.Editor:
      return [StudyRole.Editor, StudyRole.Validator]
    default:
      return Object.values(StudyRole)
  }
}

export const defaultPostColor = 'blue'

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
  [Post.TourneesAvantPremieres]: 'darkBlue',
  [Post.SallesEtCabines]: 'darkBlue',
  [Post.ConfiseriesEtBoissons]: 'orange',
  [Post.Dechets]: 'darkBlue',
  [Post.BilletterieEtCommunication]: 'darkBlue',

  [Post.ConstructionDesLocaux]: 'darkBlue',
  [Post.FroidEtClim]: 'darkBlue',
  [Post.AutresEmissions]: 'darkBlue',
  [Post.DeplacementsDePersonne]: 'green',
  [Post.TransportDeMarchandises]: 'green',
  [Post.IntrantsBiensEtMatieresTilt]: 'blue',
  [Post.Alimentation]: 'blue',
  [Post.EquipementsEtImmobilisations]: 'blue',
  [Post.Utilisation]: 'orange',
  [Post.Teletravail]: 'darkBlue',
}

export const hasEditionRights = (userRoleOnStudy: StudyRole | null) => {
  return userRoleOnStudy && userRoleOnStudy !== StudyRole.Reader
}

export const isCAS = (emissionSource: FullStudy['emissionSources'][number]) =>
  emissionSource.subPost === SubPost.EmissionsLieesAuChangementDAffectationDesSolsCas &&
  emissionSource.emissionFactor &&
  emissionSource.emissionFactor.unit === Unit.HA_YEAR

export const hasDeprecationPeriod = (subPost: SubPost) =>
  [
    ...subPostsByPost[Post.Immobilisations],
    ...subPostsByPost[Post.EquipementsEtImmobilisations],
    SubPost.Electromenager,
    SubPost.Batiment,
  ].includes(subPost)

export const STUDY_UNIT_VALUES: Record<StudyResultUnit, number> = {
  K: 1,
  T: 1000,
}

export const defaultStudyResultUnit = StudyResultUnit.T

export const isPostValidated = (data?: ResultsByPost): boolean => {
  if (!data) {
    return false
  }

  return data.numberOfEmissionSource > 0 && data.numberOfValidatedEmissionSource === data.numberOfEmissionSource
}

export const getValidationPercentage = (data?: {
  numberOfEmissionSource: number
  numberOfValidatedEmissionSource: number
}): number => {
  if (!data || data.numberOfEmissionSource === 0) {
    return 0
  }

  return (data.numberOfValidatedEmissionSource / data.numberOfEmissionSource) * 100
}

export const getEmissionValueString = (
  value: number | null | undefined,
  resultsUnit: StudyResultUnit,
  unitLabel: string,
  decimals: number = 0,
): string => {
  const safeValue = value ?? 0
  return `${formatNumber(safeValue / STUDY_UNIT_VALUES[resultsUnit], decimals)} ${unitLabel}`
}

export const getDuplicableEnvironments = (environment: Environment): Environment[] => {
  let compatibles: Environment[] = []
  switch (environment) {
    case Environment.BC:
      compatibles = [Environment.TILT]
      break
    case Environment.TILT:
      compatibles = [Environment.BC]
      break
    default:
      break
  }
  return [environment].concat(compatibles)
}
