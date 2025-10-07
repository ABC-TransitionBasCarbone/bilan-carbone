'use client'

import { FullStudy } from '@/db/study'
import { StudyWithoutDetail } from '@/services/permissions/study'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'

export default function useStudySite(study: FullStudy | StudyWithoutDetail, allowAll?: boolean) {
  const [ready, setReady] = useState(false)
  const [studySite, setSite] = useState('all')
  const searchParams = useSearchParams()
  const router = useRouter()

  useEffect(() => {
    const siteFromUrl = searchParams.get('site')
    let defaultSite: string | null = null

    if (siteFromUrl && study.sites.some((studySite) => studySite.id === siteFromUrl)) {
      defaultSite = siteFromUrl
      const params = new URLSearchParams(searchParams.toString())
      params.delete('site')
      const newUrl = params.toString() ? `${window.location.pathname}?${params.toString()}` : window.location.pathname
      router.replace(newUrl, { scroll: false })
    } else {
      defaultSite = window.localStorage.getItem(`studySite-${study.id}`)
    }

    if (!defaultSite || !study.sites.some((studySite) => studySite.id === defaultSite)) {
      defaultSite = allowAll ? 'all' : study.sites[0].id
    }
    setSite(defaultSite)
    setReady(true)
  }, [study, searchParams, allowAll, router])

  useEffect(() => {
    if (ready) {
      window.localStorage.setItem(`studySite-${study.id}`, studySite)
    }
  }, [studySite, ready, study.id])

  return {
    studySite,
    setSite,
  }
}
