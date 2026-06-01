import { situationsAreEqual } from '@/lib/publicodes/utils'
import { SimplifiedEnvironment } from '@/services/publicodes/simplifiedPublicodesConfig'
import { saveSituation as saveSituationInDB } from '@/services/serverFunctions/situation'
import { Situation } from 'publicodes'
import { useCallback, useRef, useState } from 'react'
import { ListLayoutSituations } from '../context/types'

export interface SituationAutoSaveOptions {
  studyId: string
  studySiteId: string
  modelVersion: string
  simplifiedEnvironment: SimplifiedEnvironment
  enabled?: boolean
}

export interface SituationAutoSaveReturn {
  saveSituation: (situation: Situation<string>, listLayoutSituation: ListLayoutSituations<string>) => void
  hasUnsavedChanges: boolean
  saveStatus: 'idle' | 'saving' | 'saved' | 'error'
  lastSaved?: Date
  error?: string
}

export const useSituationAutoSave = ({
  studyId,
  studySiteId,
  modelVersion,
  simplifiedEnvironment,
  enabled = true,
}: SituationAutoSaveOptions): SituationAutoSaveReturn => {
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [lastSaved, setLastSaved] = useState<Date>()
  const [error, setError] = useState<string>()

  const lastSavedSituation = useRef<Situation<string>>({})

  const performSave = useCallback(
    async (situation: Situation<string>, listLayoutSituations: ListLayoutSituations<string>) => {
      if (!enabled) {
        return
      }

      if (situationsAreEqual(situation, lastSavedSituation.current)) {
        setSaveStatus('idle')
        return
      }

      try {
        setSaveStatus('saving')
        const result = await saveSituationInDB(
          studyId,
          studySiteId,
          situation,
          listLayoutSituations,
          modelVersion,
          simplifiedEnvironment,
        )

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
    [enabled, studyId, studySiteId, modelVersion, simplifiedEnvironment],
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
