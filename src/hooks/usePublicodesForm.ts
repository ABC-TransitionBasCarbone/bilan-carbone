import { getUpdatedSituationWithInputValue } from '@/components/publicodes-form/utils'
import { loadSituation } from '@/services/serverFunctions/situation'
import Engine, { Situation } from 'publicodes'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useSituationAutoSave, UseSituationAutoSaveReturn } from './useSituationAutoSave'

export interface UsePublicodesFormOptions<S extends Situation<string>> {
  studyId: string
  studySiteId: string
  modelVersion: string
  engineFactory: () => Engine
  mergeSituation?: (loadedSituation: S) => S
  autoSaveEnabled?: boolean
  autoSaveDebounceMs?: number
}

export interface UsePublicodesFormReturn<S extends Situation<string>> {
  engine: Engine | null
  situation: S | null
  updateField: (ruleName: string, value: string | number | boolean | undefined) => void
  isLoading: boolean
  error: string | null
  autoSave: Omit<UseSituationAutoSaveReturn, 'saveSituation'>
}

export function usePublicodesForm<S extends Situation<string>>({
  studyId,
  studySiteId,
  modelVersion,
  engineFactory,
  mergeSituation,
  autoSaveEnabled = true,
  autoSaveDebounceMs = 1500,
}: UsePublicodesFormOptions<S>): UsePublicodesFormReturn<S> {
  const engineRef = useRef<Engine | null>(null)
  if (!engineRef.current) {
    engineRef.current = engineFactory().shallowCopy()
  }
  const engine = engineRef.current

  const [situation, setSituation] = useState<S | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const autoSave = useSituationAutoSave({
    studyId,
    studySiteId,
    modelVersion,
    enabled: autoSaveEnabled,
    debounceMs: autoSaveDebounceMs,
  })

  useEffect(() => {
    const loadInitialSituationFromDB = async () => {
      try {
        setIsLoading(true)
        setError(null)

        const result = await loadSituation(studySiteId)
        if (!result.success) {
          throw new Error(result.errorMessage || 'Failed to load situation')
        }

        const loadedSituation = (result.data?.situation ?? {}) as S
        const finalSituation = mergeSituation ? mergeSituation(loadedSituation) : loadedSituation

        setSituation(finalSituation)
        engine.setSituation(finalSituation as Situation<string>)
      } catch (err) {
        console.error('Failed to load situation:', err)
        setError(err instanceof Error ? err.message : 'Failed to load situation')
      } finally {
        setIsLoading(false)
      }
    }

    loadInitialSituationFromDB()
    // Note: mergeSituation is intentionally not in deps to avoid reloading on every render
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [studySiteId, engine])

  const updateField = useCallback(
    (ruleName: string, value: string | number | boolean | undefined) => {
      if (!situation || !engine) {
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
