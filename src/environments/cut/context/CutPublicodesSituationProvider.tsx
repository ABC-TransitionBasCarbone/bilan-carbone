'use client'

import { loadSituation } from '@/services/serverFunctions/situation'
import { Situation } from 'publicodes'
import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { getCutEngine } from '../publicodes/cut-engine'
import { CutPublicodesEngine, CutSituation } from '../publicodes/types'

interface CutPublicodesSituationContextValue {
  engine: CutPublicodesEngine
  situation: CutSituation | null
  setSituation: (situation: CutSituation) => void
  studySiteId: string
  isLoading: boolean
  error: string | null
}

const CutPublicodesSituationContext = createContext<CutPublicodesSituationContextValue | null>(null)

export interface CutPublicodesSituationProviderProps {
  children: ReactNode
  studyId: string
  studySiteId: string
}

export function CutPublicodesSituationProvider({
  children,
  studyId,
  studySiteId,
}: CutPublicodesSituationProviderProps) {
  const [situation, setSituationState] = useState<CutSituation | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const engine = useMemo(() => getCutEngine().shallowCopy(), [])

  const setSituation = useCallback(
    (newSituation: CutSituation) => {
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

        const loadedSituation = (result.data?.situation ?? {}) as CutSituation
        setSituation(loadedSituation)
      } catch (err) {
        console.error('Failed to load situation:', err)
        setError(err instanceof Error ? err.message : 'Failed to load situation')
      } finally {
        setIsLoading(false)
      }
    }

    loadInitialSituationFromDB()
  }, [studyId, studySiteId, setSituation])

  const value = useMemo<CutPublicodesSituationContextValue>(
    () => ({
      engine,
      situation,
      setSituation,
      studySiteId,
      isLoading,
      error,
    }),
    [engine, situation, setSituation, studySiteId, isLoading, error],
  )

  return <CutPublicodesSituationContext.Provider value={value}>{children}</CutPublicodesSituationContext.Provider>
}

export function useCutPublicodesSituation(): CutPublicodesSituationContextValue {
  const context = useContext(CutPublicodesSituationContext)
  if (!context) {
    throw new Error('useCutPublicodesSituation must be used within a CutPublicodesSituationProvider')
  }
  return context
}
