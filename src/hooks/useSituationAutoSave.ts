import { situationsAreEqual } from '@/components/publicodes-form/utils'
import { saveSituation } from '@/services/serverFunctions/situation'
import { Situation } from 'publicodes'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

export interface SituationAutoSaveOptions {
  studyId: string
  studySiteId: string
  modelVersion: string
  enabled?: boolean
  debounceMs?: number
}

export interface SituationAutoSaveReturn {
  saveSituation: (situation: Situation<string>) => void
  hasUnsavedChanges: boolean
  saveStatus: 'idle' | 'saving' | 'saved' | 'error'
  lastSaved?: Date
  error?: string
}

export const useSituationAutoSave = ({
  studyId,
  studySiteId,
  modelVersion,
  enabled = true,
  debounceMs = 1000,
}: SituationAutoSaveOptions): SituationAutoSaveReturn => {
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [lastSaved, setLastSaved] = useState<Date>()
  const [error, setError] = useState<string>()
  const [hasPendingChanges, setHasPendingChanges] = useState(false)

  const debounceTimer = useRef<NodeJS.Timeout | null>(null)
  const lastSavedSituation = useRef<Situation<string>>({})

  const performSave = useCallback(
    async (situation: Situation<string>) => {
      if (situationsAreEqual(situation, lastSavedSituation.current)) {
        setSaveStatus('idle')
        return
      }

      try {
        setSaveStatus('saving')

        const result = await saveSituation(studyId, studySiteId, situation, modelVersion)

        if (result.success) {
          lastSavedSituation.current = situation
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
    [studyId, studySiteId, modelVersion],
  )

  const saveSituationDebounced = useCallback(
    (situation: Situation<string>) => {
      if (!enabled) {
        return
      }

      setHasPendingChanges(true)
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current)
      }

      debounceTimer.current = setTimeout(async () => {
        await performSave(situation)
        setHasPendingChanges(false)
      }, debounceMs)
    },
    [enabled, debounceMs, performSave],
  )

  const hasUnsavedChanges = useMemo(() => hasPendingChanges || saveStatus === 'saving', [saveStatus, hasPendingChanges])

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
