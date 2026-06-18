import { FeFilters } from '@/types/filters'
import { ReadonlyURLSearchParams } from 'next/navigation'

const SUBPOSTS_NONE_SENTINEL = 'none'

export function convertFiltersToSearchParams(filters: FeFilters): URLSearchParams {
  const params = new URLSearchParams()

  if (filters.search) {
    params.set('search', filters.search)
  }
  if (filters.archived) {
    params.set('archived', 'true')
  }
  filters.locations.forEach((v) => params.append('locations', v))
  filters.sources.forEach((v) => params.append('sources', v))
  filters.units.forEach((v) => params.append('units', v as string))
  if (!(filters.subPosts.length === 1 && filters.subPosts[0] === 'all')) {
    if (filters.subPosts.length === 0) {
      params.set('subPosts', SUBPOSTS_NONE_SENTINEL)
    } else {
      filters.subPosts.forEach((v) => params.append('subPosts', v as string))
    }
  }
  if (filters.base !== undefined) {
    filters.base.forEach((v) => params.append('base', v))
  }

  return params
}

export function convertSearchParamsToFilters(
  params: ReadonlyURLSearchParams,
  initialImportVersions: string[],
): FeFilters {
  const sourcesFromUrl = params.getAll('sources')
  const baseFromUrl = params.getAll('base')
  const subPostsFromUrl = params.getAll('subPosts')

  let subPosts: FeFilters['subPosts']
  if (!params.has('subPosts')) {
    subPosts = ['all']
  } else if (subPostsFromUrl[0] === SUBPOSTS_NONE_SENTINEL) {
    subPosts = []
  } else {
    subPosts = subPostsFromUrl as FeFilters['subPosts']
  }

  return {
    search: params.get('search') ?? '',
    archived: params.get('archived') === 'true',
    locations: params.getAll('locations'),
    sources: sourcesFromUrl.length > 0 ? sourcesFromUrl : initialImportVersions,
    units: params.getAll('units'),
    subPosts,
    base: baseFromUrl.length > 0 ? (baseFromUrl as FeFilters['base']) : undefined,
  }
}
