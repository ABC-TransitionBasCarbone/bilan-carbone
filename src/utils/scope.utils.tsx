import type { FullStudy } from '@/db/study'
import type { BaseObjective, ObjectiveGroup, ObjectiveWithScope } from '@/types/trajectory.types'
import { getUIFilteredEmissions } from '@/utils/study'
import { SubPost } from '@prisma/client'
import { isSubset } from './array'

export const toScopedValues = <T,>(selected: T[], all: T[]) =>
  selected.length === all.length && all.every((v) => selected.includes(v)) ? [] : selected

export interface BuildObjectiveGroupsParams {
  study: Pick<FullStudy, 'emissionSources' | 'resultsUnit' | 'organizationVersion'>
  validatedOnly: boolean
  objectives: ObjectiveWithScope[]
  filterSiteIds: string[]
  filterSubPosts: SubPost[]
  filterTagIds: string[]
}

type ScopeGroup = { siteIds: string[]; subPosts: SubPost[]; tagIds: string[]; objectives: ObjectiveWithScope[] }

// Assign key for uniqueness check
const scopeKey = (siteIds: string[], subPosts: SubPost[], tagIds: string[]): string =>
  [...siteIds].sort().join(',') + '|' + [...subPosts].sort().join(',') + '|' + [...tagIds].sort().join(',')

// Check if parentScope strictly contains childScope (wider but not identical).
const isScopeWiderThan = (parentScope: ScopeGroup, childScope: ScopeGroup): boolean =>
  scopeKey(parentScope.siteIds, parentScope.subPosts, parentScope.tagIds) !==
    scopeKey(childScope.siteIds, childScope.subPosts, childScope.tagIds) &&
  isSubset(parentScope.siteIds, childScope.siteIds) &&
  isSubset(parentScope.subPosts, childScope.subPosts) &&
  isSubset(parentScope.tagIds, childScope.tagIds)

// Scope quantity = number of non-empty dimensions. Higher = narrower scope.
const scopeQuantity = (scope: ScopeGroup): number =>
  (scope.siteIds.length > 0 ? 1 : 0) + (scope.subPosts.length > 0 ? 1 : 0) + (scope.tagIds.length > 0 ? 1 : 0)

const findParentGroups = (childScope: ScopeGroup, groups: ScopeGroup[]): ScopeGroup[] =>
  groups.filter((g) => isScopeWiderThan(g, childScope)).sort((a, b) => scopeQuantity(b) - scopeQuantity(a))

const getObjectivesBefore = (objectives: BaseObjective[], beforeYear: number): BaseObjective[] => {
  const sorted = objectives.filter((obj) => obj.targetYear <= beforeYear).sort((a, b) => a.targetYear - b.targetYear)
  if (sorted.length === 0 || sorted[sorted.length - 1].targetYear < beforeYear) {
    const covering = objectives
      .filter((obj) => obj.targetYear > beforeYear)
      .sort((a, b) => a.targetYear - b.targetYear)[0]
    if (covering) {
      sorted.push({ targetYear: beforeYear, reductionRate: covering.reductionRate })
    }
  }
  return sorted
}

/**
 * Finds parent objectives to use as a prefix before a sub-objective's startYear.
 * Walks up from the narrowest parent scope to the widest, then falls back to global.
 * If a parent objective spans across beforeYear without ending exactly at it,
 * a synthetic objective is created at beforeYear with that objective's rate.
 */
const findParentObjectivesBefore = (
  childScope: ScopeGroup,
  groups: ScopeGroup[],
  beforeYear: number,
  globalObjectives: BaseObjective[],
): BaseObjective[] => {
  for (const parent of findParentGroups(childScope, groups)) {
    const parentObjs = parent.objectives.map((obj) => ({
      targetYear: obj.targetYear,
      reductionRate: Number(obj.reductionRate),
    }))
    const result = getObjectivesBefore(parentObjs, beforeYear)
    if (result.length > 0) {
      return result
    }
  }

  return getObjectivesBefore(globalObjectives, beforeYear)
}

/**
 * Finds parent objectives to use as a suffix after a sub-objective's last targetYear.
 * Walks up from the narrowest parent scope to the widest, then falls back to global.
 * Returns only objectives whose targetYear is strictly after afterYear.
 */
const findParentObjectivesAfter = (
  childScope: ScopeGroup,
  groups: ScopeGroup[],
  afterYear: number,
  globalObjectives: BaseObjective[],
): BaseObjective[] => {
  for (const parent of findParentGroups(childScope, groups)) {
    const parentObjs = [...parent.objectives]
      .sort((a, b) => a.targetYear - b.targetYear)
      .filter((obj) => obj.targetYear > afterYear)
      .map((obj) => ({ targetYear: obj.targetYear, reductionRate: Number(obj.reductionRate) }))
    if (parentObjs.length > 0) {
      return parentObjs
    }
  }

  return globalObjectives.filter((obj) => obj.targetYear > afterYear)
}

/**
 * Splits emissions into independent objective groups based on sub-objectives and UI filters.
 * Each sub-objective scope becomes a group with its own ratio (share of filtered emissions)
 * and a cascaded objective chain: parent prefix → sub-objective(s) → parent suffix.
 * Remaining emissions not covered by any sub-objective go into a "DEFAULT" group.
 * Returns undefined if there are no sub-objectives or no filtered emissions.
 */
export const buildObjectiveGroups = ({
  study,
  validatedOnly,
  objectives,
  filterSiteIds,
  filterSubPosts,
  filterTagIds,
}: BuildObjectiveGroupsParams): ObjectiveGroup[] | undefined => {
  const subObjectives = objectives.filter((obj) => !obj.isDefault)
  if (subObjectives.length === 0) {
    return undefined
  }

  const globalObjectives = objectives
    .filter((obj) => obj.isDefault)
    .map((obj) => ({ targetYear: obj.targetYear, reductionRate: Number(obj.reductionRate) }))
    .sort((a, b) => a.targetYear - b.targetYear)

  const filteredEmissions = getUIFilteredEmissions(study, validatedOnly, filterSiteIds, filterSubPosts, filterTagIds)
  if (filteredEmissions === 0) {
    return undefined
  }

  const groupMap = new Map<string, ScopeGroup>()
  for (const obj of subObjectives) {
    const siteIds = obj.sites.map((s) => s.studySite.siteId)
    const subPostValues = obj.subPosts.map((sp) => sp.subPost)
    const tagIds = obj.tags.map((t) => t.studyTag.id)

    const key = scopeKey(siteIds, subPostValues, tagIds)
    if (!groupMap.has(key)) {
      groupMap.set(key, { siteIds, subPosts: subPostValues, tagIds, objectives: [] })
    }

    groupMap.get(key)!.objectives.push(obj)
  }

  const allGroups = [...groupMap.values()]
  const objectiveGroups: ObjectiveGroup[] = []
  let totalSubRatio = 0

  for (const group of allGroups) {
    const scopeFilteredEmissions = getUIFilteredEmissions(
      study,
      validatedOnly,
      group.siteIds.length > 0
        ? group.siteIds.filter((id) => filterSiteIds.length === 0 || filterSiteIds.includes(id))
        : filterSiteIds,
      group.subPosts.length > 0
        ? group.subPosts.filter((sp) => filterSubPosts.length === 0 || filterSubPosts.includes(sp))
        : filterSubPosts,
      group.tagIds.length > 0
        ? group.tagIds.filter((id) => filterTagIds.length === 0 || filterTagIds.includes(id))
        : filterTagIds,
    )
    const finalRatio = scopeFilteredEmissions / filteredEmissions

    const sortedGroupObjectives = [...group.objectives].sort((a, b) => {
      const aStart = a.startYear ?? a.targetYear
      const bStart = b.startYear ?? b.targetYear
      return aStart - bStart
    })

    const firstSubStartYear = sortedGroupObjectives[0].startYear ?? sortedGroupObjectives[0].targetYear
    const lastTargetYear = sortedGroupObjectives[sortedGroupObjectives.length - 1].targetYear
    const parentPrefix = findParentObjectivesBefore(group, allGroups, firstSubStartYear, globalObjectives)

    const cascadedObjectives: BaseObjective[] = [
      ...parentPrefix,
      ...sortedGroupObjectives.map((obj) => ({
        targetYear: obj.targetYear,
        reductionRate: Number(obj.reductionRate),
      })),
    ]

    const parentSuffix = findParentObjectivesAfter(group, allGroups, lastTargetYear, globalObjectives)
    for (const parentObj of parentSuffix) {
      cascadedObjectives.push(parentObj)
    }

    totalSubRatio += finalRatio
    objectiveGroups.push({ ratio: finalRatio, objectives: cascadedObjectives })
  }

  const globalRatio = Math.max(0, 1 - totalSubRatio)
  objectiveGroups.push({ ratio: globalRatio, objectives: globalObjectives })

  return objectiveGroups
}
