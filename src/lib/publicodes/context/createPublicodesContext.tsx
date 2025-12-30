'use client'

import { useToast } from '@/components/base/ToastProvider'
import { useBeforeUnload } from '@/hooks/useBeforeUnload'
import { loadSituation } from '@/services/serverFunctions/situation'
import { useTranslations } from 'next-intl'
import Engine, { Situation } from 'publicodes'
import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { useSituationAutoSave } from '../hooks/useSituationAutoSave'
import { getUpdatedSituationWithInputValue, situationsAreEqual } from '../utils'

export interface PublicodesSituationContextValue<
  RuleName extends string = string,
  S extends Situation<RuleName> = Situation<RuleName>,
> {
  engine: Engine<RuleName>
  situation: S | null
  setSituation: (situation: S) => void
  studySiteId: string
  isLoading: boolean
  error: string | null
}

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error'

export interface AutoSaveState {
  hasUnsavedChanges: boolean
  saveStatus: SaveStatus
  lastSaved?: Date
  error?: string
}

export interface PublicodesAutoSaveContextValue<RuleName extends string = string> {
  updateField: (ruleName: RuleName, value: string | number | boolean | undefined) => void
  autoSave: AutoSaveState
}

export type PublicodesFormContextValue<
  RuleName extends string = string,
  S extends Situation<RuleName> = Situation<RuleName>,
> = PublicodesSituationContextValue<RuleName, S> & PublicodesAutoSaveContextValue<RuleName>

export interface CreatePublicodesContextOptions<RuleName extends string> {
  getEngine: () => Engine<RuleName>
  modelVersion: string
}

export interface PublicodesSituationProviderProps {
  studyId: string
  studySiteId: string
  children: ReactNode
}

export interface PublicodesFormProviderProps {
  studyId: string
  studySiteId: string
  syncIntervalMs?: number
  children: ReactNode
}

export function createPublicodesContext<
  RuleName extends string = string,
  S extends Situation<RuleName> = Situation<RuleName>,
>({ getEngine, modelVersion }: CreatePublicodesContextOptions<RuleName>) {
  const PublicodesSituationContext = createContext<PublicodesSituationContextValue<RuleName, S> | null>(null)
  const PublicodesAutoSaveContext = createContext<PublicodesAutoSaveContextValue<RuleName> | null>(null)

  function PublicodesSituationProvider({ studyId, studySiteId, children }: PublicodesSituationProviderProps) {
    const [situation, setSituationState] = useState<S | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const engine = useMemo(() => getEngine().shallowCopy(), [])

    const setSituation = useCallback(
      (newSituation: S) => {
        engine.setSituation(newSituation as Situation<string>)
        setSituationState(newSituation)
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

          const loadedSituation = (result.data?.situation ?? {}) as S
          setSituation(loadedSituation)
        } catch (err) {
          console.error('Failed to load situation:', err)
          setError(err instanceof Error ? err.message : 'Failed to load situation')
        } finally {
          setIsLoading(false)
        }
      }

      loadInitialSituationFromDB()
    }, [studyId, studySiteId])

    const value = useMemo<PublicodesSituationContextValue<RuleName, S>>(
      () => ({
        engine,
        situation,
        setSituation,
        studySiteId,
        isLoading,
        error,
      }),
      [situation, setSituation, studySiteId, isLoading, error],
    )

    return <PublicodesSituationContext.Provider value={value}>{children}</PublicodesSituationContext.Provider>
  }

  function usePublicodesSituation(): PublicodesSituationContextValue<RuleName, S> {
    const context = useContext(PublicodesSituationContext)
    if (!context) {
      throw new Error('usePublicodesSituation must be used within a PublicodesSituationProvider')
    }
    return context
  }

  function PublicodesAutoSaveProvider({
    children,
    studyId,
    syncIntervalMs = 10000,
  }: Omit<PublicodesFormProviderProps, 'studySiteId'>) {
    const t = useTranslations('saveStatus')
    const { showSuccessToast } = useToast()
    const { situation, engine, setSituation, studySiteId } = usePublicodesSituation()

    const lastSyncedAt = useRef<Date>(new Date())

    // Keep a ref to situation for stable updateField callback
    const situationRef = useRef(situation)
    situationRef.current = situation

    const autoSave = useSituationAutoSave({
      studyId,
      studySiteId,
      modelVersion,
      enabled: true,
    })

    useBeforeUnload({
      when: autoSave.hasUnsavedChanges,
    })

    useEffect(() => {
      if (!syncIntervalMs || syncIntervalMs <= 0 || !studySiteId) {
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
          if (
            dbUpdatedAt &&
            dbUpdatedAt > lastSyncedAt.current &&
            !situationsAreEqual(situationInDB, situation ?? {})
          ) {
            setSituation(situationInDB)
            lastSyncedAt.current = dbUpdatedAt
            showSuccessToast(t('syncedFromOtherUser'))
          }
        } catch (err) {
          console.warn('Failed to sync situation from DB:', err)
        }
      }

      const interval = setInterval(syncFromDB, syncIntervalMs)

      return () => {
        clearInterval(interval)
      }
    }, [studySiteId, syncIntervalMs, autoSave.hasUnsavedChanges, setSituation, situation, showSuccessToast, t])

    const updateField = useCallback(
      (ruleName: RuleName, value: string | number | boolean | undefined) => {
        const currentSituation = situationRef.current
        if (!currentSituation) {
          return
        }

        const newSituation = getUpdatedSituationWithInputValue(engine, currentSituation, ruleName, value) as S
        setSituation(newSituation)
        autoSave.saveSituation(newSituation)
      },
      [engine, setSituation, autoSave.saveSituation],
    )

    const autoSaveState = useMemo<AutoSaveState>(
      () => ({
        hasUnsavedChanges: autoSave.hasUnsavedChanges,
        saveStatus: autoSave.saveStatus,
        lastSaved: autoSave.lastSaved,
        error: autoSave.error,
      }),
      [autoSave],
    )

    const value = useMemo<PublicodesAutoSaveContextValue<RuleName>>(
      () => ({
        updateField,
        autoSave: autoSaveState,
      }),
      [updateField, autoSaveState],
    )

    return <PublicodesAutoSaveContext.Provider value={value}>{children}</PublicodesAutoSaveContext.Provider>
  }

  function usePublicodesAutoSave(): PublicodesAutoSaveContextValue<RuleName> {
    const context = useContext(PublicodesAutoSaveContext)
    if (!context) {
      throw new Error('usePublicodesAutoSave must be used within a PublicodesAutoSaveProvider')
    }
    return context
  }

  function PublicodesFormProvider({ children, studyId, studySiteId, syncIntervalMs }: PublicodesFormProviderProps) {
    return (
      <PublicodesSituationProvider studyId={studyId} studySiteId={studySiteId}>
        <PublicodesAutoSaveProvider studyId={studyId} syncIntervalMs={syncIntervalMs}>
          {children}
        </PublicodesAutoSaveProvider>
      </PublicodesSituationProvider>
    )
  }

  function usePublicodes(): PublicodesFormContextValue<RuleName, S> {
    const situationContext = usePublicodesSituation()
    const autoSaveContext = usePublicodesAutoSave()

    return {
      ...situationContext,
      ...autoSaveContext,
    }
  }

  return {
    PublicodesSituationProvider,
    usePublicodesSituation,
    usePublicodesAutoSave,
    PublicodesFormProvider,
    usePublicodes,
  }
}
