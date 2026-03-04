const overlaps = (stored: string[], filter: string[]): boolean => {
  return stored.some((id) => filter.includes(id))
}

/**
 * AND logic across all active filter dimensions.
 * Empty stored scope for a dimension means "all" → always passes that dimension.
 * Empty filter for a dimension means "no filter active" → always passes.
 */
export const matchesScopeFilter = (
  rowSiteIds: string[],
  rowSubPosts: string[],
  rowTagIds: string[],
  filterSiteIds: string[],
  filterSubPosts: string[],
  filterTagIds: string[],
): boolean => {
  if (filterTagIds.length > 0 && rowTagIds.length > 0) {
    if (!overlaps(rowTagIds, filterTagIds)) {
      return false
    }
  }

  if (filterSubPosts.length > 0 && rowSubPosts.length > 0) {
    if (!overlaps(rowSubPosts, filterSubPosts)) {
      return false
    }
  }

  if (filterSiteIds.length > 0 && rowSiteIds.length > 0) {
    if (!overlaps(rowSiteIds, filterSiteIds)) {
      return false
    }
  }

  return true
}
