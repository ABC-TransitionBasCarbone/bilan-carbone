export type FeFilters = {
  archived: boolean
  search: string
  location: string
  sources: string[]
  units: (BCUnit | string)[]
  subPosts: (SubPost | 'all')[]
}
