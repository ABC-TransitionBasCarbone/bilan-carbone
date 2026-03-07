import { useLocalStorageSync } from '@/hooks/useLocalStorageSync'
import { SubPost } from '@prisma/client'
import { useEffect, useState } from 'react'

export const useTransitionPlanFilters = (studyId: string) => {
  const [selectedSiteIds, setSelectedSiteIds] = useState<string[]>([])
  const [selectedSubPosts, setSelectedSubPosts] = useState<SubPost[]>([])
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([])
  const [filtersMounted, setFiltersMounted] = useState(false)

  const filtersStorageKey = `transition-plan-filters-${studyId}`
  useLocalStorageSync(
    filtersStorageKey,
    { siteIds: selectedSiteIds, subPosts: selectedSubPosts, tagIds: selectedTagIds },
    filtersMounted,
  )

  useEffect(() => {
    const storedFilters = localStorage.getItem(filtersStorageKey)
    if (storedFilters) {
      const parsed = JSON.parse(storedFilters)
      if (Array.isArray(parsed.siteIds) && parsed.siteIds.every((id: unknown) => typeof id === 'string')) {
        setSelectedSiteIds(parsed.siteIds)
      }
      if (Array.isArray(parsed.subPosts)) {
        const validSubPosts = parsed.subPosts.filter(
          (subPost: unknown): subPost is SubPost =>
            typeof subPost === 'string' && Object.values(SubPost).includes(subPost as SubPost),
        )
        setSelectedSubPosts(validSubPosts)
      }
      if (Array.isArray(parsed.tagIds) && parsed.tagIds.every((id: unknown) => typeof id === 'string')) {
        setSelectedTagIds(parsed.tagIds)
      }
    }
    setFiltersMounted(true)
  }, [filtersStorageKey])

  return {
    selectedSiteIds,
    selectedSubPosts,
    selectedTagIds,
    filtersMounted,
    setSelectedSiteIds,
    setSelectedSubPosts,
    setSelectedTagIds,
  }
}
