'use client'

import { ReactNode } from 'react'
import { CutRuleName, CutSituation } from '../publicodes/types'
import {
  CutPublicodesAutoSaveProvider,
  CutPublicodesAutoSaveProviderProps,
  useCutPublicodesAutoSave,
} from './CutPublicodesAutoSaveProvider'
import {
  CutPublicodesSituationProvider,
  CutPublicodesSituationProviderProps,
  useCutPublicodesSituation,
} from './CutPublicodesSituationProvider'

export interface CutPublicodesFormProviderProps {
  studyId: string
  studySiteId: string
  autoSaveDebounceMs?: number
  syncIntervalMs?: number
  children: ReactNode
}

/**
 * Combined provider for CUT Publicodes forms.
 * Wraps both CutPublicodesSituationProvider and CutPublicodesAutoSaveProvider.
 * Use this for form pages that need auto-save functionality.
 */
export function CutPublicodesFormProvider({
  studyId,
  studySiteId,
  autoSaveDebounceMs,
  syncIntervalMs,
  children,
}: CutPublicodesFormProviderProps) {
  return (
    <CutPublicodesSituationProvider studyId={studyId} studySiteId={studySiteId}>
      <CutPublicodesAutoSaveProvider
        studyId={studyId}
        autoSaveDebounceMs={autoSaveDebounceMs}
        syncIntervalMs={syncIntervalMs}
      >
        {children}
      </CutPublicodesAutoSaveProvider>
    </CutPublicodesSituationProvider>
  )
}

export interface UseCutPublicodesReturn {
  engine: ReturnType<typeof useCutPublicodesSituation>['engine']
  situation: CutSituation | null
  setSituation: (situation: CutSituation) => void
  studySiteId: string
  isLoading: boolean
  error: string | null
  updateField: (ruleName: CutRuleName, value: string | number | boolean | undefined) => void
  autoSave: {
    hasUnsavedChanges: boolean
    saveStatus: 'idle' | 'saving' | 'saved' | 'error'
    lastSaved?: Date
    error?: string
  }
}

/**
 * Combined hook for CUT Publicodes forms.
 * Must be used within a CutPublicodesFormProvider.
 * Returns both situation context and auto-save functionality.
 */
export function useCutPublicodes(): UseCutPublicodesReturn {
  const situationContext = useCutPublicodesSituation()
  const autoSaveContext = useCutPublicodesAutoSave()

  return {
    ...situationContext,
    ...autoSaveContext,
  }
}

// Re-export individual providers and hooks for granular usage
export { CutPublicodesAutoSaveProvider, useCutPublicodesAutoSave } from './CutPublicodesAutoSaveProvider'
export { CutPublicodesSituationProvider, useCutPublicodesSituation } from './CutPublicodesSituationProvider'
export type { CutPublicodesAutoSaveProviderProps, CutPublicodesSituationProviderProps }
