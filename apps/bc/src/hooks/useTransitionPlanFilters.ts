import 'client-only'

import { storageKeys } from '@/constants/storage.constants'
import { useLocalStorageSync } from '@/hooks/useLocalStorageSync'
import { readStoredStringArray } from '@/utils/localStorage'
import { resolveFilterIds } from '@/utils/scopeFilter'
import { SubPost } from '@abc-transitionbascarbone/common/db/enums'
import { useEffect, useState } from 'react'

export const useTransitionPlanFilters = (studyId: string, validTagIds: string[] = [], validSiteIds: string[] = []) => {
  const [selectedSiteIds, setSelectedSiteIds] = useState<string[]>([])
  const [selectedSubPosts, setSelectedSubPosts] = useState<SubPost[]>([])
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([])
  const [filtersMounted, setFiltersMounted] = useState(false)

  const sitesKey = storageKeys.studyFilterSites(studyId)
  const sitesAllKey = storageKeys.studyFilterSitesAll(studyId)
  const subpostsKey = storageKeys.studyFilterSubposts(studyId)
  const tagsKey = storageKeys.studyFilterTags(studyId)
  const tagsAllKey = storageKeys.studyFilterTagsAll(studyId)

  useLocalStorageSync(sitesKey, selectedSiteIds, filtersMounted)
  useLocalStorageSync(sitesAllKey, validSiteIds, filtersMounted)
  useLocalStorageSync(subpostsKey, selectedSubPosts, filtersMounted)
  useLocalStorageSync(tagsKey, selectedTagIds, filtersMounted)
  useLocalStorageSync(tagsAllKey, validTagIds, filtersMounted)

  useEffect(() => {
    const storedSites = readStoredStringArray(sitesKey)
    if (storedSites) {
      const resolved = resolveFilterIds(storedSites, validSiteIds, sitesAllKey, sitesKey)
      if (resolved !== null) {
        setSelectedSiteIds(resolved)
      }
    }

    const storedSubposts = readStoredStringArray(subpostsKey)
    if (storedSubposts) {
      const valid = storedSubposts.filter((subPost): subPost is SubPost =>
        Object.values(SubPost).includes(subPost as SubPost),
      )
      setSelectedSubPosts(valid)
    }

    const storedTags = readStoredStringArray(tagsKey)
    if (storedTags && storedTags.length > 0) {
      const resolved = resolveFilterIds(storedTags, validTagIds, tagsAllKey, tagsKey)
      if (resolved !== null) {
        setSelectedTagIds(resolved)
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
