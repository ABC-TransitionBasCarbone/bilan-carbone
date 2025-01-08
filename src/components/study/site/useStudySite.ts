'use client'

import { FullStudy } from '@/db/study'
import { StudyWithoutDetail } from '@/services/permissions/study'
import { useEffect, useState } from 'react'

export default function useStudySite(study: FullStudy | StudyWithoutDetail, allowAll?: boolean) {
  const [ready, setReady] = useState(false)
  const [site, setSite] = useState('all')

  useEffect(() => {
    const defaultSite = window.localStorage.getItem(`studySite-${study.id}`) || 'all'
    if (defaultSite === 'all' && !allowAll) {
      setSite(study.sites[0].id)
    } else {
      setSite(defaultSite)
    }
    setReady(true)
  }, [study])

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
