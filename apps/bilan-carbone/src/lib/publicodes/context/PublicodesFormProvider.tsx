import { useToast } from '@/components/base/ToastProvider'
import { getUpdatedSituationWithInputValue, situationsAreEqual } from '@/components/publicodes-form/utils'
import { useBeforeUnload } from '@/hooks/useBeforeUnload'
import { useLatestRef } from '@/hooks/utils'
import { SimplifiedEnvironment } from '@/services/publicodes/simplifiedPublicodesConfig'
import { loadSituation } from '@/services/serverFunctions/situation'
import { useTranslations } from 'next-intl'
import { Situation } from 'publicodes'
import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useRef } from 'react'
import { useSituationAutoSave } from '../hooks/useSituationAutoSave'
import { aggregateSituationValues } from '../utils'
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
  updateListLayoutSituation: (
    targetRule: RuleName,
    situationId: string,
    rule: RuleName,
    value: string | number | boolean | undefined,
  ) => void
  createNewListLayoutSituation: (targetRule: RuleName, situationId?: string) => void
  deleteListLayoutSituation: (targetRule: RuleName, situationId: string) => void
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
  const { engine, situation, listLayoutSituations, setSituation, studySiteId, config } =
    usePublicodesSituation<RuleName>()
  const lastSyncedAt = useRef<Date>(new Date())

  const autoSave = useSituationAutoSave({
    studyId,
    studySiteId,
    modelVersion: config.modelVersion,
    enabled: true,
  })

  useBeforeUnload({
    when: autoSave.hasUnsavedChanges,
  })

  // NOTE: we use refs to always have the latest values in the callbacks,
  // without having to add them to the dependency arrays.
  const currentSituationRef = useLatestRef(situation)
  const currentListLayoutSituationsRef = useLatestRef(listLayoutSituations)
  const hasUnsavedChangesRef = useLatestRef(autoSave.hasUnsavedChanges)
  const showSuccessToastRef = useLatestRef(showSuccessToast)
  const tRef = useLatestRef(t)

  useEffect(() => {
    if (!syncIntervalMs || syncIntervalMs <= 0 || !studySiteId) {
      return
    }

    const syncFromDB = async () => {
      if (hasUnsavedChangesRef.current) {
        return
      }

      try {
        const result = await loadSituation(studyId, studySiteId)
        if (!result.success || !result.data) {
          return
        }

        const dbUpdatedAt = result.data.updatedAt ? new Date(result.data.updatedAt) : null
        const situationInDB = (result.data.situation ?? {}) as Situation<RuleName>
        if (
          dbUpdatedAt &&
          dbUpdatedAt > lastSyncedAt.current &&
          !situationsAreEqual(situationInDB, currentSituationRef.current ?? {})
        ) {
          setSituation(situationInDB)
          lastSyncedAt.current = dbUpdatedAt
          showSuccessToastRef.current(tRef.current('syncedFromOtherUser'))
        }
      } catch (err) {
        console.warn('Failed to sync situation from DB:', err)
      }
    }

    const interval = setInterval(syncFromDB, syncIntervalMs)

    return () => {
      clearInterval(interval)
    }
  }, [studyId, studySiteId, syncIntervalMs, setSituation])

  const updateField = useCallback(
    (ruleName: RuleName, value: string | number | boolean | undefined) => {
      const currentSituation = currentSituationRef.current
      const currentListLayoutSituations = currentListLayoutSituationsRef.current

      const newSituation = getUpdatedSituationWithInputValue(engine, currentSituation, ruleName, value)

      setSituation(newSituation, currentListLayoutSituations)
      autoSave.saveSituation(newSituation, currentListLayoutSituations)
    },
    [engine, setSituation, autoSave.saveSituation],
  )

  const patchListLayoutSituation = (
    patchFn: (
      prevRows: Array<{ id: string; situation: Situation<RuleName> }>,
      targetRule: RuleName,
    ) => Array<{ id: string; situation: Situation<RuleName> }>,
    targetRule: RuleName,
  ) => {
    const prevRows = currentListLayoutSituationsRef.current[targetRule] ?? []
    const newRows = patchFn(prevRows, targetRule)
    const newListLayoutSituations = { ...currentListLayoutSituationsRef.current, [targetRule]: newRows }
    const aggregatedTargetValue = aggregateSituationValues(engine, targetRule, newRows)
    const newSituation = { ...currentSituationRef.current, [targetRule]: aggregatedTargetValue }

    setSituation(newSituation, newListLayoutSituations)
    autoSave.saveSituation(newSituation, newListLayoutSituations)
  }

  const updateListLayoutSituation = useCallback(
    (targetRule: RuleName, situationId: string, rule: RuleName, value: string | number | boolean | undefined) => {
      patchListLayoutSituation((prevRows) => {
        return prevRows.map(({ id, situation }) => {
          if (id !== situationId) {
            return { id, situation }
          }
          const newSituation = getUpdatedSituationWithInputValue(engine, situation, rule, value)
          return { id, situation: newSituation }
        })
      }, targetRule)
    },
    [engine],
  )

  const createNewListLayoutSituation = useCallback((targetRule: RuleName, situationId?: string) => {
    patchListLayoutSituation((prevRows) => {
      const prevSituation = prevRows.find(({ id }) => id === situationId)?.situation ?? {}
      const newSituationListEntry = {
        id: crypto.randomUUID(),
        situation: situationId ? prevSituation : {},
      }
      return [...prevRows, newSituationListEntry]
    }, targetRule)
  }, [])

  const deleteListLayoutSituation = useCallback((targetRule: RuleName, situationId: string) => {
    patchListLayoutSituation((prevRows) => {
      return prevRows.filter(({ id }) => id !== situationId)
    }, targetRule)
  }, [])

  const value = useMemo<PublicodesAutoSaveContextValue<RuleName>>(
    () => ({
      updateField,
      updateListLayoutSituation,
      createNewListLayoutSituation,
      deleteListLayoutSituation,
      isSaving: autoSave.saveStatus === 'saving',
      saveStatus: autoSave.saveStatus,
      hasUnsavedChanges: autoSave.hasUnsavedChanges,
      lastSaved: autoSave.lastSaved,
      saveError: autoSave.error,
    }),
    [
      updateField,
      updateListLayoutSituation,
      createNewListLayoutSituation,
      deleteListLayoutSituation,
      autoSave.saveStatus,
      autoSave.lastSaved,
      autoSave.error,
    ],
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
