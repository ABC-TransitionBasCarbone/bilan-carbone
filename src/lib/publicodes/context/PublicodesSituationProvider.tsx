import {
  getSimplifiedPublicodesConfig,
  SimplifiedEnvironment,
  SimplifiedPublicodesConfig,
} from '@/services/publicodes/simplifiedPublicodesConfig'
import { loadSituation } from '@/services/serverFunctions/situation'
import Engine, { Situation } from 'publicodes'
import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { ListLayoutSituations } from './types'

export interface PublicodesSituationContextValue<RuleName extends string = string> {
  engine: Engine<RuleName>
  situation: Situation<RuleName>
  listLayoutSituations: ListLayoutSituations<RuleName>
  studySiteId: string
  setSituation: (situation: Situation<RuleName>, listLayoutSituations?: ListLayoutSituations<RuleName>) => void
  isLoading: boolean
  error: string | null
  config: SimplifiedPublicodesConfig<RuleName>
}

const PublicodesSituationContext = createContext<PublicodesSituationContextValue | null>(null)

interface PublicodesSituationProviderProps {
  environment: SimplifiedEnvironment
  studyId: string
  studySiteId: string
  children: ReactNode
}

export function PublicodesSituationProvider<RuleName extends string = string>({
  environment,
  studyId,
  studySiteId,
  children,
}: PublicodesSituationProviderProps) {
  const config = getSimplifiedPublicodesConfig(environment) as SimplifiedPublicodesConfig<RuleName>
  const [situation, setSituationState] = useState<Situation<RuleName>>({})
  const [listLayoutSituations, setListLayoutSituationsState] = useState<ListLayoutSituations<RuleName>>({})

  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const engine = useMemo(() => config.getEngine().shallowCopy() as Engine<RuleName>, [config])

  const setSituation = useCallback(
    (newSituation: Situation<RuleName>, listLayoutSituations?: ListLayoutSituations<RuleName>) => {
      engine.setSituation(newSituation)
      setSituationState(
        // NOTE: We get the filtered situation from the engine to ensure that only
        // valid situation entries are stored.
        engine.getSituation(),
      )
      if (listLayoutSituations) {
        // NOTE: there is no sync with the main situation here, it's done by
        // the [udpateListLayoutSituation] function of the
        // [PublicodesFormProvider]. Therefore, this state setter should only
        // be used in the [PublicodesFormProvider].
        setListLayoutSituationsState(listLayoutSituations)
      }
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

        const loadedSituation = (result.data?.situation ?? {}) as Situation<RuleName>
        const loadedListLayoutSituations = (result.data?.listLayoutSituations ?? {}) as ListLayoutSituations<RuleName>
        setIsLoading(false)
        setSituation(loadedSituation, loadedListLayoutSituations)
      } catch (err) {
        setIsLoading(false)
        console.error('Failed to load situation:', err)
        setError(err instanceof Error ? err.message : 'Failed to load situation')
      }
    }

    loadInitialSituationFromDB()
  }, [studyId, studySiteId])

  const value = useMemo<PublicodesSituationContextValue<RuleName>>(
    () => ({
      engine,
      situation,
      listLayoutSituations,
      config,
      setSituation,
      studySiteId,
      isLoading,
      error,
    }),
    [engine, situation, listLayoutSituations, config, studySiteId, isLoading, error],
  )

  return <PublicodesSituationContext.Provider value={value}>{children}</PublicodesSituationContext.Provider>
}

export function usePublicodesSituation<RuleName extends string = string>(): PublicodesSituationContextValue<RuleName> {
  const context = useContext(PublicodesSituationContext)
  if (!context) {
    throw new Error('usePublicodesSituation must be used within a PublicodesSituationProvider')
  }
  return context as PublicodesSituationContextValue<RuleName>
}
