'use client'

import { storageKeys } from '@/constants/storage.constants'
import type { StudySiteWithName } from '@/db/study'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useMemo, useRef, useState } from 'react'

export default function useStudySite(studyId: string, studySites: StudySiteWithName[], allowAll?: boolean) {
  const [siteId, setSiteState] = useState('')
  const searchParams = useSearchParams()
  const router = useRouter()
  const allSiteIds = useMemo(() => studySites.map((s) => s.site.id), [studySites])
  const storageKey = storageKeys.studyFilterSites(studyId)
  const userChangedRef = useRef(false)

  useEffect(() => {
    const siteFromUrl = searchParams.get('site')
    let resolvedSite: string | null = null

    if (siteFromUrl && studySites.some((s) => s.site.id === siteFromUrl)) {
      resolvedSite = siteFromUrl
      const params = new URLSearchParams(searchParams.toString())
      params.delete('site')
      const newUrl = params.toString() ? `${window.location.pathname}?${params.toString()}` : window.location.pathname
      router.replace(newUrl, { scroll: false })
    } else {
      const stored = window.localStorage.getItem(storageKey)
      if (stored) {
        const storedIds: unknown = JSON.parse(stored)
        if (Array.isArray(storedIds) && storedIds.every((id) => typeof id === 'string')) {
          const allPresent = allSiteIds.length > 0 && allSiteIds.every((id) => storedIds.includes(id))
          if (allPresent && allowAll) {
            resolvedSite = 'all'
          } else {
            // If there are multiple sites, we need to find the first valid site
            const firstValid = storedIds.find((id) => studySites.some((s) => s.site.id === id))
            resolvedSite = firstValid ?? null
          }
        }
      }
    }

    if (!resolvedSite) {
      resolvedSite = allowAll ? 'all' : (allSiteIds[0] ?? '')
    }

    setSiteState(resolvedSite)
  }, [allSiteIds, allowAll, router, searchParams, storageKey, studyId, studySites])

  const setSite = (site: string) => {
    userChangedRef.current = true
    setSiteState(site)
  }

  useEffect(() => {
    if (!userChangedRef.current || !siteId) {
      return
    }
    const idsToStore = siteId === 'all' ? allSiteIds : [siteId]
    window.localStorage.setItem(storageKey, JSON.stringify(idsToStore))
  }, [siteId, storageKey, allSiteIds])

  const studySiteId = useMemo(() => studySites.find((s) => s.site.id === siteId)?.id ?? '', [studySites, siteId])

  return {
    siteId,
    studySiteId,
    setSite,
  }
}
