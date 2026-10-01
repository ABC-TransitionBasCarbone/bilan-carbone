import { SubPost } from '@abc-transitionbascarbone/db-common/enums'

const filtersMatcheScope = (scope: string[], filters: string[]): boolean => {
  return scope.some((id) => filters.includes(id))
}

/**
 * Determines if the scope values match the UI filters.
 * If a UI filter is empty, it means "filter has nothing selected" → always fails.
 * If a scope array is empty, it means "all" → always passes.
 */
export const scopeMatchesUIFilters = (
  scopeSiteIds: string[],
  scopeSubPosts: SubPost[],
  scopeTagIds: string[],
  filterSiteIds: string[],
  filterSubPosts: SubPost[],
  filterTagIds: string[],
  allTagIds: string[] = filterTagIds,
): boolean => {
  if (filterSiteIds.length === 0 || filterSubPosts.length === 0) {
    return false
  }
  if (filterTagIds.length === 0 && allTagIds.length > 0) {
    return false
  }

  if (scopeTagIds.length > 0 && !filtersMatcheScope(scopeTagIds, filterTagIds)) {
    return false
  }

  if (scopeSubPosts.length > 0 && !filtersMatcheScope(scopeSubPosts, filterSubPosts)) {
    return false
  }

  if (scopeSiteIds.length > 0 && !filtersMatcheScope(scopeSiteIds, filterSiteIds)) {
    return false
  }

  return true
}

/**
 * Update and clean localStorage when filters are changed
 */
export const resolveFilterIds = (
  stored: string[],
  currentValidIds: string[],
  allKey: string,
  filterKey: string,
): string[] | null => {
  const storedAllRaw = localStorage.getItem(allKey)
  const storedAll: string[] = storedAllRaw ? (JSON.parse(storedAllRaw) as string[]) : []

  const wasSelectAll = storedAll.length > 0 && storedAll.every((id) => stored.includes(id))
  if (wasSelectAll) {
    localStorage.removeItem(filterKey)
    localStorage.removeItem(allKey)
    return null
  }

  const validIds = stored.filter((id) => currentValidIds.includes(id))
  if (validIds.length === 0) {
    localStorage.removeItem(filterKey)
    localStorage.removeItem(allKey)
    return null
  }
  if (validIds.length < stored.length) {
    localStorage.setItem(filterKey, JSON.stringify(validIds))
  }
  return validIds
}
