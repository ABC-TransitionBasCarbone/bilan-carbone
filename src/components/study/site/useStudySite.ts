'use client'

import { FullStudy } from '@/db/study'
import { StudyWithoutDetail } from '@/services/permissions/study'
import { useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'

export default function useStudySite(study: FullStudy | StudyWithoutDetail, allowAll?: boolean) {
  const [ready, setReady] = useState(false)
  const [studySite, setSite] = useState('all')
  const searchParams = useSearchParams()

  useEffect(() => {
    const siteFromUrl = searchParams.get('site')
    let defaultSite: string | null = null

    if (siteFromUrl && study.sites.some((studySite) => studySite.id === siteFromUrl)) {
      defaultSite = siteFromUrl
    } else {
      defaultSite = window.localStorage.getItem(`studySite-${study.id}`)
    }

    if (!defaultSite || !study.sites.some((studySite) => studySite.id === defaultSite)) {
      defaultSite = allowAll ? 'all' : study.sites[0].id
    }
    setSite(defaultSite)
    setReady(true)
  }, [study, searchParams, allowAll])

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
