'use client'

import { useEffect, useState } from 'react'

export const getStudySite = (studyId: string) => window.localStorage.getItem(`studySite-${studyId}`) || ''

export default function useStudySite(studyId: string) {
  const [site, setSite] = useState<string>('')

  useEffect(() => {
    setSite(getStudySite(studyId))
  }, [studyId])

  useEffect(() => {
    window.localStorage.setItem(`studySite-${studyId}`, site)
  }, [site])

  return { site, setSite }
}
