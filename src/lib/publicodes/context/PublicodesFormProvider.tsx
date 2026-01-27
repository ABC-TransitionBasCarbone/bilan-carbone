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
import { aggregateSituationValues, getUpdatedSituationWithNewSituationList } from '../utils'
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
  // NOTE: we use refs to always have the latest situation values in the
  // callbacks, without having to add them to the dependency arrays.
  const currentSituationRef = useLatestRef(situation)
  const currentListLayoutSituationsRef = useLatestRef(listLayoutSituations)

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
  }, [studyId, studySiteId, syncIntervalMs, autoSave.hasUnsavedChanges, setSituation, situation, showSuccessToast, t])

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

  const updateListLayoutSituation = useCallback(
    (targetRule: RuleName, situationId: string, rule: RuleName, value: string | number | boolean | undefined) => {
      const currentListLayoutSituations = currentListLayoutSituationsRef.current
      const currentSituation = currentSituationRef.current
      const currentSituationList =
        currentListLayoutSituations[targetRule]?.find(({ id }) => id === situationId)?.situation ?? {}

      // Update the specific situation in the list layout situations (e.g. the
      // updated row)
      const newSituationList = getUpdatedSituationWithInputValue(engine, currentSituationList, rule, value)

      const newListLayoutSituations = getUpdatedSituationWithNewSituationList(
        currentListLayoutSituations,
        targetRule,
        situationId,
        newSituationList,
      )

      // Update the main situation with the new aggregated value for the target
      // rule of the list layout
      const aggregatedTargetValue = aggregateSituationValues(
        engine,
        targetRule,
        newListLayoutSituations[targetRule] ?? [],
      )
      const newSituation = {
        ...currentSituation,
        [targetRule]: aggregatedTargetValue,
      }

      setSituation(newSituation, newListLayoutSituations)
      autoSave.saveSituation(newSituation, newListLayoutSituations)
    },
    [engine, setSituation, autoSave.saveSituation],
  )

  const value = useMemo<PublicodesAutoSaveContextValue<RuleName>>(
    () => ({
      updateField,
      updateListLayoutSituation,
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
