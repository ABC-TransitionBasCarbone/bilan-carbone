import { storageKeys } from '@/constants/storage.constants'
import { useLocalStorageSync } from '@/hooks/useLocalStorageSync'
import { SubPost } from '@prisma/client'
import { useEffect, useState } from 'react'

export const useTransitionPlanFilters = (studyId: string) => {
  const [selectedSiteIds, setSelectedSiteIds] = useState<string[]>([])
  const [selectedSubPosts, setSelectedSubPosts] = useState<SubPost[]>([])
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([])
  const [filtersMounted, setFiltersMounted] = useState(false)

  const sitesKey = storageKeys.studyFilterSites(studyId)
  const subpostsKey = storageKeys.studyFilterSubposts(studyId)
  const tagsKey = storageKeys.studyFilterTags(studyId)

  useLocalStorageSync(sitesKey, selectedSiteIds, filtersMounted)
  useLocalStorageSync(subpostsKey, selectedSubPosts, filtersMounted)
  useLocalStorageSync(tagsKey, selectedTagIds, filtersMounted)

  useEffect(() => {
    const storedSites = localStorage.getItem(sitesKey)
    if (storedSites) {
      const parsed: unknown = JSON.parse(storedSites)
      if (Array.isArray(parsed) && parsed.every((id: unknown) => typeof id === 'string')) {
        setSelectedSiteIds(parsed)
      }
    }

    const storedSubposts = localStorage.getItem(subpostsKey)
    if (storedSubposts) {
      const parsed: unknown = JSON.parse(storedSubposts)
      if (Array.isArray(parsed)) {
        const valid = parsed.filter(
          (subPost: unknown): subPost is SubPost =>
            typeof subPost === 'string' && Object.values(SubPost).includes(subPost as SubPost),
        )
        setSelectedSubPosts(valid)
      }
    }

    const storedTags = localStorage.getItem(tagsKey)
    if (storedTags) {
      const parsed: unknown = JSON.parse(storedTags)
      if (Array.isArray(parsed) && parsed.length > 0 && parsed.every((id: unknown) => typeof id === 'string')) {
        setSelectedTagIds(parsed)
      }
    }

    setFiltersMounted(true)
    // This effect is only used to mount the filters, so we don't need to re-run it when the study id changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [studyId])

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
