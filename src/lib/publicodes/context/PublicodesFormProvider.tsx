import { useToast } from '@/components/base/ToastProvider'
import { getUpdatedSituationWithInputValue, situationsAreEqual } from '@/components/publicodes-form/utils'
import { useBeforeUnload } from '@/hooks/useBeforeUnload'
import { SimplifiedEnvironment } from '@/services/publicodes/simplifiedPublicodesConfig'
import { loadSituation } from '@/services/serverFunctions/situation'
import { useTranslations } from 'next-intl'
import { Situation } from 'publicodes'
import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useRef } from 'react'
import { useSituationAutoSave } from '../hooks/useSituationAutoSave'
import {
  PublicodesSituationContextValue,
  PublicodesSituationProvider,
  usePublicodesSituation,
} from './PublicodesSituationProvider'

interface PublicodesFormContextValue<RuleName extends string = string>
  extends PublicodesSituationContextValue<RuleName>, PublicodesAutoSaveContextValue<RuleName> {}

interface PublicodesFormProviderProps {
  environment: SimplifiedEnvironment
  studyId: string
  studySiteId: string
  syncIntervalMs?: number
  children: ReactNode
}

export function PublicodesFormProvider({
  environment,
  studyId,
  studySiteId,
  syncIntervalMs,
  children,
}: PublicodesFormProviderProps) {
  return (
    <PublicodesSituationProvider environment={environment} studyId={studyId} studySiteId={studySiteId}>
      <PublicodesAutoSaveProvider environment={environment} studyId={studyId} syncIntervalMs={syncIntervalMs}>
        {children}
      </PublicodesAutoSaveProvider>
    </PublicodesSituationProvider>
  )
}
export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error'

export interface PublicodesAutoSaveContextValue<RuleName extends string = string> {
  updateField: (ruleName: RuleName, value: string | number | boolean | undefined) => void
  isSaving: boolean
  saveStatus: SaveStatus
  hasUnsavedChanges: boolean
  lastSaved?: Date
  saveError?: string
}

const PublicodesAutoSaveContext = createContext<PublicodesAutoSaveContextValue | null>(null)

function PublicodesAutoSaveProvider<RuleName extends string = string>({
  children,
  studyId,
  syncIntervalMs = 10000,
}: Omit<PublicodesFormProviderProps, 'studySiteId'>) {
  const t = useTranslations('saveStatus')
  const { showSuccessToast } = useToast()
  const { situation, engine, setSituation, studySiteId, config } = usePublicodesSituation()

  const lastSyncedAt = useRef<Date>(new Date())

  // Keep a ref to situation for stable updateField callback
  const situationRef = useRef(situation)
  situationRef.current = situation

  const autoSave = useSituationAutoSave({
    studyId,
    studySiteId,
    modelVersion: config.modelVersion,
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
        const situationInDB = (result.data.situation ?? {}) as Situation<RuleName>
        if (dbUpdatedAt && dbUpdatedAt > lastSyncedAt.current && !situationsAreEqual(situationInDB, situation ?? {})) {
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

      const newSituation = getUpdatedSituationWithInputValue(
        engine,
        currentSituation,
        ruleName,
        value,
      ) as Situation<RuleName>
      setSituation(newSituation)
      autoSave.saveSituation(newSituation)
    },
    [engine, setSituation, autoSave.saveSituation],
  )

  const value = useMemo<PublicodesAutoSaveContextValue<RuleName>>(
    () => ({
      updateField,
      isSaving: autoSave.saveStatus === 'saving',
      saveStatus: autoSave.saveStatus,
      hasUnsavedChanges: autoSave.hasUnsavedChanges,
      lastSaved: autoSave.lastSaved,
      saveError: autoSave.error,
    }),
    [updateField, autoSave],
  )

  return (
    <PublicodesAutoSaveContext.Provider value={value as PublicodesAutoSaveContextValue}>
      {children}
    </PublicodesAutoSaveContext.Provider>
  )
}

function usePublicodesAutoSave<RuleName extends string = string>(): PublicodesAutoSaveContextValue<RuleName> {
  const context = useContext(PublicodesAutoSaveContext)
  if (!context) {
    throw new Error('usePublicodesAutoSave must be used within a PublicodesAutoSaveProvider')
  }
  return context
}

export function usePublicodesForm<RuleName extends string = string>(): PublicodesFormContextValue<RuleName> {
  const situationContext = usePublicodesSituation<RuleName>()
  const autoSaveContext = usePublicodesAutoSave<RuleName>()

  return {
    ...situationContext,
    ...autoSaveContext,
  }
}
