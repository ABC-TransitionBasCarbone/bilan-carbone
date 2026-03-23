import { SubPost } from  '@repo/db-common/enums'

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
): boolean => {
  if (filterTagIds.length === 0 || filterSubPosts.length === 0 || filterSiteIds.length === 0) {
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
