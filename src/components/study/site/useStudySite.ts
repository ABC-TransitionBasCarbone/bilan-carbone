'use client'

import { FullStudy } from '@/db/study'
import { StudyWithoutDetail } from '@/services/permissions/study'
import { useEffect, useState } from 'react'

export default function useStudySite(study: FullStudy | StudyWithoutDetail, allowAll?: boolean) {
  const [ready, setReady] = useState(false)
  const [studySite, setSite] = useState('all')

  useEffect(() => {
    let defaultSite = window.localStorage.getItem(`studySite-${study.id}`)
    if (!defaultSite || !study.sites.some((studySite) => studySite.id === defaultSite)) {
      defaultSite = allowAll ? 'all' : study.sites[0].id
    }
    setSite(defaultSite)
    setReady(true)
  }, [study])

  useEffect(() => {
    if (ready) {
      window.localStorage.setItem(`studySite-${study.id}`, studySite)
    }
  }, [studySite])

  return {
    studySite,
    setSite,
  }
}
