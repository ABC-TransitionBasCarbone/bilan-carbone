import { situationsAreEqual } from '@/lib/publicodes/utils'
import { saveSituation } from '@/services/serverFunctions/situation'
import { Situation } from 'publicodes'
import { useCallback, useRef, useState } from 'react'

export interface SituationAutoSaveOptions {
  studyId: string
  studySiteId: string
  modelVersion: string
  enabled?: boolean
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
}: SituationAutoSaveOptions): SituationAutoSaveReturn => {
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [lastSaved, setLastSaved] = useState<Date>()
  const [error, setError] = useState<string>()

  const lastSavedSituation = useRef<Situation<string>>({})

  const performSave = useCallback(
    async (situation: Situation<string>) => {
      if (!enabled) {
        return
      }

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
    [enabled, studyId, studySiteId, modelVersion],
  )

  const hasUnsavedChanges = saveStatus === 'saving'

  return {
    saveSituation: performSave,
    hasUnsavedChanges,
    saveStatus,
    lastSaved,
    error,
  }
}
