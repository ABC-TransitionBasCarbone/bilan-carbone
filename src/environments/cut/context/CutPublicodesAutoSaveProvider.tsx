'use client'

import { useToast } from '@/components/base/ToastProvider'
import { getUpdatedSituationWithInputValue, situationsAreEqual } from '@/components/publicodes-form/utils'
import { PUBLICODES_COUNT_VERSION } from '@/constants/versions'
import { useBeforeUnload } from '@/hooks/useBeforeUnload'
import { useSituationAutoSave } from '@/hooks/useSituationAutoSave'
import { loadSituation } from '@/services/serverFunctions/situation'
import { useTranslations } from 'next-intl'
import { Situation } from 'publicodes'
import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useRef } from 'react'
import { CutRuleName, CutSituation } from '../publicodes/types'
import { useCutPublicodesSituation } from './CutPublicodesSituationProvider'

interface CutPublicodesAutoSaveContextValue {
  updateField: (ruleName: CutRuleName, value: string | number | boolean | undefined) => void
  autoSave: {
    hasUnsavedChanges: boolean
    saveStatus: 'idle' | 'saving' | 'saved' | 'error'
    lastSaved?: Date
    error?: string
  }
}

const CutPublicodesAutoSaveContext = createContext<CutPublicodesAutoSaveContextValue | null>(null)

export interface CutPublicodesAutoSaveProviderProps {
  children: ReactNode
  studyId: string
  autoSaveDebounceMs?: number
  syncIntervalMs?: number
}

export function CutPublicodesAutoSaveProvider({
  children,
  studyId,
  autoSaveDebounceMs = 1500,
  syncIntervalMs = 10000,
}: CutPublicodesAutoSaveProviderProps) {
  const t = useTranslations('saveStatus')
  const { showSuccessToast } = useToast()
  const { engine, situation, setSituation, studySiteId } = useCutPublicodesSituation()

  const lastSyncedAt = useRef<Date>(new Date())

  const autoSave = useSituationAutoSave({
    studyId,
    studySiteId,
    modelVersion: PUBLICODES_COUNT_VERSION,
    enabled: true,
    debounceMs: autoSaveDebounceMs,
  })

  useBeforeUnload({
    when: autoSave.hasUnsavedChanges,
  })

  // Periodic sync from database to detect changes by other users
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
        const situationInDB = (result.data.situation ?? {}) as CutSituation
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
    (ruleName: CutRuleName, value: string | number | boolean | undefined) => {
      if (!situation) {
        return
      }

      const newSituation = getUpdatedSituationWithInputValue(engine, situation, ruleName, value) as CutSituation
      engine.setSituation(newSituation as Situation<string>)
      setSituation(newSituation)
      autoSave.saveSituation(newSituation)
    },
    [situation, engine, setSituation, autoSave],
  )

  const value = useMemo<CutPublicodesAutoSaveContextValue>(
    () => ({
      updateField,
      autoSave: {
        hasUnsavedChanges: autoSave.hasUnsavedChanges,
        saveStatus: autoSave.saveStatus,
        lastSaved: autoSave.lastSaved,
        error: autoSave.error,
      },
    }),
    [updateField, autoSave],
  )

  return <CutPublicodesAutoSaveContext.Provider value={value}>{children}</CutPublicodesAutoSaveContext.Provider>
}

export function useCutPublicodesAutoSave(): CutPublicodesAutoSaveContextValue {
  const context = useContext(CutPublicodesAutoSaveContext)
  if (!context) {
    throw new Error('useCutPublicodesAutoSave must be used within a CutPublicodesAutoSaveProvider')
  }
  return context
}
