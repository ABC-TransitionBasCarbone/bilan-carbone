const filtersMatcheScope = (scope: string[], filters: string[]): boolean => {
  return scope.some((id) => filters.includes(id))
}

/**
 * AND logic across all active filter types.
 * Empty DB scope for a type means "all" → always passes that type.
 * Empty UI filter for a type means "filter has nothing selected" → always fails.
 */
export const matchesScopeFilter = (
  rowSiteIds: string[],
  rowSubPosts: string[],
  rowTagIds: string[],
  filterSiteIds: string[],
  filterSubPosts: string[],
  filterTagIds: string[],
): boolean => {
  if (filterTagIds.length === 0 || filterSubPosts.length === 0 || filterSiteIds.length === 0) {
    return false
  }

  if (rowTagIds.length > 0 && !filtersMatcheScope(rowTagIds, filterTagIds)) {
    return false
  }

  if (rowSubPosts.length > 0 && !filtersMatcheScope(rowSubPosts, filterSubPosts)) {
    return false
  }

  if (rowSiteIds.length > 0 && !filtersMatcheScope(rowSiteIds, filterSiteIds)) {
    return false
  }

  return true
}
