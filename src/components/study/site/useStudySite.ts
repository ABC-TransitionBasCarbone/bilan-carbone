'use client'

import { FullStudy } from '@/db/study'
import { useEffect, useState } from 'react'

export const getStudySite = (studyId: string) => window.localStorage.getItem(`studySite-${studyId}`) || 'all'

export default function useStudySite(study: FullStudy, allowAll?: boolean) {
  const [ready, setReady] = useState(false)
  const [site, setSite] = useState('all')

  useEffect(() => {
    const defaultSite = getStudySite(study.id)
    if (defaultSite === 'all' && !allowAll) {
      setSite(study.sites[0].id)
    } else {
      setSite(defaultSite)
    }
    setReady(true)
  }, [])

  useEffect(() => {
    if (ready) {
      window.localStorage.setItem(`studySite-${study.id}`, site)
    }
  }, [site])

  return {
    site,
    setSite,
  }
}
