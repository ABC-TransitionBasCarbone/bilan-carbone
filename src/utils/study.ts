import { FullStudy } from '@/db/study'
import { getEmissionResults, getEmissionSourcesTotalCo2 } from '@/services/emissionSource'
import { isAdminOnStudyOrga } from '@/services/permissions/study'
import { Post, subPostsByPost } from '@/services/posts'
import { ResultsByPost } from '@/services/results/consolidated'
import { UpdateEmissionSourceCommand } from '@/services/serverFunctions/emissionSource.command'
import { hasSufficientLevel } from '@/services/study'
import { isAdmin } from '@/utils/user'
import {
  EmissionFactorBase,
  EmissionFactorPartType,
  Environment,
  Export,
  Level,
  Role,
  StudyResultUnit,
  StudyRole,
  SubPost,
  Unit,
} from '@prisma/client'
import { Getter } from '@tanstack/react-table'
import { UserSession } from 'next-auth'
import { intersectArraysWithFallback, unique } from './array'
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

export type StudyWithRoleFields = {
  id: string
  level: Level
  isPublic: boolean
  organizationVersion: {
    id: string
    parentId: string | null
    environment: Environment
    activatedLicence: number[]
    parent: { activatedLicence: number[] } | null
  }
  allowedUsers: { role: StudyRole; account: { id: string; user: { email: string } } }[]
}

export const getAccountRoleOnStudy = (user: UserSession, study: StudyWithRoleFields) => {
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

export const getDisplayedRoleOnStudy = (
  user: UserSession,
  study: StudyWithRoleFields & { contributors: { accountId: string }[] },
) => {
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

export const hasFabricationPart = (emissionFactor?: FullStudy['emissionSources'][number]['emissionFactor']) =>
  emissionFactor?.emissionFactorParts.some((part) => part.type === EmissionFactorPartType.Fabrication) || false

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

/**
 * Calculates the monetary ratio percentage from monetary value and total value
 */
export const calculateMonetaryRatio = (monetaryValue: number, totalValue: number): number => {
  if (totalValue === 0) {
    return 0
  }
  return (monetaryValue / totalValue) * 100
}

export const exportSpecificFields: Record<Export, (keyof UpdateEmissionSourceCommand)[]> = {
  [Export.Beges]: ['caracterisation'] as const,
  [Export.GHGP]: ['caracterisation', 'constructionYear'] as const,
  [Export.ISO14069]: [],
}

export const getAllSpecificFieldsForExports = (exportTypes: Export[]) => {
  if (!exportTypes) {
    return []
  }
  return exportTypes.reduce(
    (res, exportType) => unique(exportType ? res.concat(exportSpecificFields[exportType as Export]) : res),
    [] as (keyof UpdateEmissionSourceCommand)[],
  )
}

export const formatEmission = (getValue: Getter<number>, resultsUnit: StudyResultUnit) =>
  formatNumber(getValue() / STUDY_UNIT_VALUES[resultsUnit])

export const formatEmissionFromNumber = (value: number, resultsUnit: StudyResultUnit) =>
  formatNumber(value / STUDY_UNIT_VALUES[resultsUnit])

export const formatConfidenceInterval = (confidenceInterval: number[], resultsUnit: StudyResultUnit) => {
  return `[${formatEmissionFromNumber(confidenceInterval[0], resultsUnit)} ;
                                  ${formatEmissionFromNumber(confidenceInterval[1], resultsUnit)}]`
}

export const getBaseFilteredEmissionSources = <T extends Pick<FullStudy['emissionSources'][number], 'emissionFactor'>>(
  emissionSources: T[],
  base: EmissionFactorBase = EmissionFactorBase.LocationBased,
) =>
  emissionSources.filter(
    (emissionSource) =>
      !emissionSource.emissionFactor ||
      !emissionSource.emissionFactor.base ||
      emissionSource.emissionFactor.base === base,
  )

/**
 * Computes emissions after applying filters coming from DB scope or UI selectors.
 */
const getFilteredEmissionTotalValue = (
  study: Pick<FullStudy, 'emissionSources' | 'resultsUnit' | 'organizationVersion'>,
  validatedOnly: boolean,
  siteIds: string[],
  subPosts: SubPost[],
  tagIds: string[],
  // emptyFilterIncludesAll controls empty-array logic which is inverted for DB scope and UI filters:
  //   - false (UI filters): empty = user selected nothing = no sources match = returns 0
  //   - true (scope from DB): empty = no scope saved = all sources pass
  emptyFilterIncludesAll: boolean,
): number => {
  const environment = study.organizationVersion.environment
  let filteredSources = study.emissionSources

  if (validatedOnly) {
    filteredSources = filteredSources.filter((source) => source.validated)
  }

  if (!emptyFilterIncludesAll || siteIds.length > 0) {
    filteredSources = filteredSources.filter((source) => source.studySite && siteIds.includes(source.studySite.site.id))
  }

  if (!emptyFilterIncludesAll || subPosts.length > 0) {
    filteredSources = filteredSources.filter((source) => subPosts.includes(source.subPost))
  }

  if (!emptyFilterIncludesAll || tagIds.length > 0) {
    filteredSources = filteredSources.filter((source) => {
      const hasNoTags = source.emissionSourceTags.length === 0
      const untaggedSelected = tagIds.includes('other')
      return (hasNoTags && untaggedSelected) || source.emissionSourceTags.some((t) => tagIds.includes(t.tag.id))
    })
  }

  const emissionSourcesWithEmission = filteredSources.map((source) => ({
    ...source,
    ...getEmissionResults(source, environment),
  }))

  const totalCo2InKg = getEmissionSourcesTotalCo2(emissionSourcesWithEmission)
  return totalCo2InKg / STUDY_UNIT_VALUES[study.resultsUnit]
}

export const getUIFilteredEmissions = (
  study: Pick<FullStudy, 'emissionSources' | 'resultsUnit' | 'organizationVersion'>,
  validatedOnly: boolean,
  siteIds: string[],
  subPosts: SubPost[],
  tagIds: string[],
): number => getFilteredEmissionTotalValue(study, validatedOnly, siteIds, subPosts, tagIds, false)

const getActionFilteredEmissions = (
  study: Pick<FullStudy, 'emissionSources' | 'resultsUnit' | 'organizationVersion'>,
  validatedOnly: boolean,
  siteIds: string[],
  subPosts: SubPost[],
  tagIds: string[],
): number => getFilteredEmissionTotalValue(study, validatedOnly, siteIds, subPosts, tagIds, true)

export const getActionReductionRatio = (
  study: Pick<FullStudy, 'emissionSources' | 'resultsUnit' | 'organizationVersion'>,
  validatedOnly: boolean,
  actionSiteIds: string[],
  actionSubPosts: SubPost[],
  actionTagIds: string[],
  filterSiteIds: string[],
  filterSubPosts: SubPost[],
  filterTagIds: string[],
): number => {
  const emissionsWithActionScope = getActionFilteredEmissions(
    study,
    validatedOnly,
    actionSiteIds,
    actionSubPosts,
    actionTagIds,
  )

  if (emissionsWithActionScope === 0) {
    return 1
  }

  const intersectedSiteIds = intersectArraysWithFallback(actionSiteIds, filterSiteIds)
  const intersectedSubPosts = intersectArraysWithFallback(actionSubPosts, filterSubPosts)
  const intersectedTagIds = intersectArraysWithFallback(actionTagIds, filterTagIds)

  const emissionsWithActionScopeAndFilters = getActionFilteredEmissions(
    study,
    validatedOnly,
    intersectedSiteIds,
    intersectedSubPosts,
    intersectedTagIds,
  )

  return emissionsWithActionScopeAndFilters / emissionsWithActionScope
}
