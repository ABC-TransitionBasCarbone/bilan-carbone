import { useLocalStorageSync } from '@/hooks/useLocalStorageSync'
import { useEffect, useState } from 'react'

export const useTransitionPlanFilters = (studyId: string) => {
  const [selectedSiteIds, setSelectedSiteIds] = useState<string[]>([])
  const [selectedPostIds, setSelectedPostIds] = useState<string[]>([])
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([])
  const [filtersMounted, setFiltersMounted] = useState(false)

  const filtersStorageKey = `transition-plan-filters-${studyId}`
  useLocalStorageSync(
    filtersStorageKey,
    { siteIds: selectedSiteIds, postIds: selectedPostIds, tagIds: selectedTagIds },
    filtersMounted,
  )

  useEffect(() => {
    const storedFilters = localStorage.getItem(filtersStorageKey)
    if (storedFilters) {
      const parsed = JSON.parse(storedFilters)
      if (parsed.siteIds) {
        setSelectedSiteIds(parsed.siteIds)
      }
      if (parsed.postIds) {
        setSelectedPostIds(parsed.postIds)
      }
      if (parsed.tagIds) {
        setSelectedTagIds(parsed.tagIds)
      }
    }
    setFiltersMounted(true)
  }, [filtersStorageKey])

  return {
    selectedSiteIds,
    selectedPostIds,
    selectedTagIds,
    filtersMounted,
    setSelectedSiteIds,
    setSelectedPostIds,
    setSelectedTagIds,
  }
}
