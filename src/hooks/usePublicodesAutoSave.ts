import { saveSituation } from '@/services/serverFunctions/publicodes'
import { Situation } from 'publicodes'
import { useCallback, useEffect, useRef, useState } from 'react'

export interface UsePublicodesAutoSaveOptions {
  studyId: string
  studySiteId: string
  modelVersion: string
  enabled?: boolean
  debounceMs?: number
}

export interface UsePublicodesAutoSaveReturn {
  saveSituation: (situation: Situation<string>) => void
  hasUnsavedChanges: boolean
  saveStatus: 'idle' | 'saving' | 'saved' | 'error'
  lastSaved?: Date
  error?: string
}

export const usePublicodesAutoSave = ({
  studyId,
  studySiteId,
  modelVersion,
  enabled = true,
  debounceMs = 1000,
}: UsePublicodesAutoSaveOptions): UsePublicodesAutoSaveReturn => {
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [lastSaved, setLastSaved] = useState<Date>()
  const [error, setError] = useState<string>()

  const debounceTimer = useRef<NodeJS.Timeout | null>(null)
  const lastSavedSituation = useRef<Situation<string>>({})
  const pendingSituation = useRef<Situation<string> | null>(null)

  const situationsAreEqual = useCallback((sit1: Situation<string>, sit2: Situation<string>): boolean => {
    return JSON.stringify(sit1) === JSON.stringify(sit2)
  }, [])

  const performSave = useCallback(
    async (situation: Situation<string>) => {
      if (situationsAreEqual(situation, lastSavedSituation.current)) {
        setSaveStatus('idle')
        pendingSituation.current = null
        return
      }

      try {
        setSaveStatus('saving')

        const result = await saveSituation(studyId, studySiteId, situation, modelVersion)

        if (result.success) {
          lastSavedSituation.current = situation
          pendingSituation.current = null
          setSaveStatus('saved')
          setLastSaved(new Date())
          setError(undefined)
        } else {
          setSaveStatus('error')
          setError(result.errorMessage || 'Failed to save situation')
        }
      } catch (err) {
        setSaveStatus('error')
        setError(err instanceof Error ? err.message : 'Unknown error')
      }
    },
    [studySiteId, modelVersion, situationsAreEqual],
  )

  const saveSituationDebounced = useCallback(
    (situation: Situation<string>) => {
      if (!enabled) return

      pendingSituation.current = situation
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current)
      }

      debounceTimer.current = setTimeout(() => {
        performSave(situation)
      }, debounceMs)
    },
    [enabled, debounceMs, performSave],
  )

  const hasUnsavedChanges = pendingSituation.current !== null || saveStatus === 'saving'

  useEffect(() => {
    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current)
      }
    }
  }, [])

  return {
    saveSituation: saveSituationDebounced,
    hasUnsavedChanges,
    saveStatus,
    lastSaved,
    error,
  }
}
