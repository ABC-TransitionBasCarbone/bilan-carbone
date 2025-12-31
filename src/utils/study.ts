import { FullStudy } from '@/db/study'
import { isAdminOnStudyOrga } from '@/services/permissions/study'
import { Post, subPostsByPost } from '@/services/posts'
import { ResultsByPost } from '@/services/results/consolidated'
import { UpdateEmissionSourceCommand } from '@/services/serverFunctions/emissionSource.command'
import { hasSufficientLevel } from '@/services/study'
import { isAdmin } from '@/utils/user'
import { Environment, Export, Level, Role, StudyResultUnit, StudyRole, SubPost, Unit } from '@prisma/client'
import { UserSession } from 'next-auth'
import { formatNumber } from './number'
import { hasActiveLicence, isInOrgaOrParent } from './organization'

export const getUserRoleOnPublicStudy = (
  user: Pick<UserSession, 'role' | 'level' | 'environment'>,
  studyLevel: Level,
) => {
  if (isAdmin(user.role)) {
    return hasSufficientLevel(user.level, studyLevel) ? StudyRole.Validator : StudyRole.Reader
  }

  if (user.environment === Environment.CUT) {
    return StudyRole.Editor
  }

  return user.role === Role.COLLABORATOR && hasSufficientLevel(user.level, studyLevel)
    ? StudyRole.Editor
    : StudyRole.Reader
}

export const getAccountRoleOnStudy = (user: UserSession, study: FullStudy) => {
  if (isAdminOnStudyOrga(user, study.organizationVersion)) {
    return hasSufficientLevel(user.level, study.level) && hasActiveLicence(study.organizationVersion)
      ? StudyRole.Validator
      : StudyRole.Reader
  }

  const right = study.allowedUsers.find((right) => right.account.id === user.accountId)
  if (right) {
    return hasSufficientLevel(user.level, study.level) && hasActiveLicence(study.organizationVersion)
      ? right.role
      : StudyRole.Reader
  }

  if (study.isPublic && isInOrgaOrParent(user.organizationVersionId, study.organizationVersion)) {
    return hasActiveLicence(study.organizationVersion) ? getUserRoleOnPublicStudy(user, study.level) : StudyRole.Reader
  }

  return null
}

export const getDisplayedRoleOnStudy = (user: UserSession, study: FullStudy) => {
  return study.contributors.some((contributor) => contributor.accountId === user.accountId)
    ? 'Contributor'
    : getAccountRoleOnStudy(user, study)
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

  [Post.Restauration]: 'darkBlue',
  [Post.Achats]: 'darkBlue',

  [Post.EnergiesClickson]: 'darkblue',
  [Post.DeplacementsClickson]: 'darblue',
  [Post.ImmobilisationsClickson]: 'darblue',
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

export const convertValue = (value: number, fromUnit: StudyResultUnit, toUnit: StudyResultUnit): number => {
  return (value * STUDY_UNIT_VALUES[fromUnit]) / STUDY_UNIT_VALUES[toUnit]
}

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

export const formatEmissionValueForExport = (value: number, unit: StudyResultUnit): number => {
  return Math.round(value / STUDY_UNIT_VALUES[unit])
}

export const exportSpecificFields: Record<Export, (keyof UpdateEmissionSourceCommand)[]> = {
  [Export.Beges]: ['caracterisation'] as const,
  [Export.GHGP]: ['caracterisation', 'constructionYear'] as const,
  [Export.ISO14069]: [],
}
