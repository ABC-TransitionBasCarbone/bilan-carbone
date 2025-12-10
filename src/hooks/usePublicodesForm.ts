import { getUpdatedSituationWithInputValue, situationsAreEqual } from '@/components/publicodes-form/utils'
import { loadSituation } from '@/services/serverFunctions/situation'
import { JsonValue } from '@prisma/client/runtime/library'
import Engine, { Situation } from 'publicodes'
import { useCallback, useEffect, useRef, useState } from 'react'
import { SituationAutoSaveReturn, useSituationAutoSave } from './useSituationAutoSave'

export interface PublicodesFormOptions {
  studyId: string
  studySiteId: string
  modelVersion: string
  engine: Engine
  autoSaveEnabled?: boolean
  autoSaveDebounceMs?: number
  syncIntervalMs?: number
  onSyncUpdate?: () => void
}

export interface PublicodesFormReturn<S extends Situation<string>> {
  engine: Engine
  situation: S | null
  updateField: (ruleName: string, value: string | number | boolean | undefined) => void
  isLoading: boolean
  error: string | null
  autoSave: Omit<SituationAutoSaveReturn, 'saveSituation'>
}

export function usePublicodesForm<S extends Situation<string>>({
  studyId,
  studySiteId,
  modelVersion,
  engine,
  autoSaveEnabled = true,
  autoSaveDebounceMs = 1500,
  syncIntervalMs = -1,
  onSyncUpdate,
}: PublicodesFormOptions): PublicodesFormReturn<S> {
  const [situation, setSituation] = useState<S | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const lastSyncedAt = useRef<Date>(new Date())

  const autoSave = useSituationAutoSave({
    studyId,
    studySiteId,
    modelVersion,
    enabled: autoSaveEnabled,
    debounceMs: autoSaveDebounceMs,
  })

  const setFullSituation = useCallback(
    (loadedSituation: JsonValue | undefined, timestamp?: Date) => {
      const situation = (loadedSituation ?? {}) as S

      engine.setSituation(situation as Situation<string>)
      setSituation(situation)
      lastSyncedAt.current = timestamp ?? new Date()
    },
    [engine],
  )

  useEffect(() => {
    const loadInitialSituationFromDB = async () => {
      try {
        setIsLoading(true)
        setError(null)

        const result = await loadSituation(studyId, studySiteId)
        if (!result.success) {
          throw new Error(result.errorMessage || 'Failed to load situation')
        }

        setFullSituation(result.data?.situation, result.data?.updatedAt)
      } catch (err) {
        console.error('Failed to load situation:', err)
        setError(err instanceof Error ? err.message : 'Failed to load situation')
      } finally {
        setIsLoading(false)
      }
    }

    loadInitialSituationFromDB()
  }, [studyId, studySiteId, setFullSituation])

  // Periodic sync from database to detect changes by other users
  useEffect(() => {
    if (!syncIntervalMs || syncIntervalMs <= 0) {
      return
    }

    const syncFromDB = async () => {
      if (autoSave.hasUnsavedChanges) {
        return
      }

      try {
        const result = await loadSituation(studyId, studySiteId)
        if (!result.success || !result.data) {
          return
        }

        const dbUpdatedAt = result.data.updatedAt ? new Date(result.data.updatedAt) : null
        const situationInDB = (result.data.situation ?? {}) as S
        if (dbUpdatedAt && dbUpdatedAt > lastSyncedAt.current && !situationsAreEqual(situationInDB, situation ?? {})) {
          setFullSituation(result.data.situation, dbUpdatedAt)
          if (onSyncUpdate) {
            onSyncUpdate()
          }
        }
      } catch (err) {
        // Silently fail sync - don't disrupt user experience
        console.warn('Failed to sync situation from DB:', err)
      }
    }

    const interval = setInterval(syncFromDB, syncIntervalMs)

    return () => {
      clearInterval(interval)
    }
  }, [studyId, studySiteId, syncIntervalMs, autoSave.hasUnsavedChanges, onSyncUpdate, setFullSituation, situation])

  const updateField = useCallback(
    (ruleName: string, value: string | number | boolean | undefined) => {
      if (!situation) {
        return
      }

      const newSituation = getUpdatedSituationWithInputValue(engine, situation, ruleName, value) as S
      engine.setSituation(newSituation as Situation<string>)
      setSituation(newSituation)
      autoSave.saveSituation(newSituation)
    },
    [situation, engine, autoSave],
  )

  return {
    engine,
    situation,
    updateField,
    isLoading,
    error,
    autoSave,
  }
}
