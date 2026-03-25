'use client'
import type { FullStudy } from '@/db/study'
import {
  getSimplifiedPublicodesConfig,
  SimplifiedEnvironment,
  SimplifiedPublicodesConfig,
} from '@/services/publicodes/simplifiedPublicodesConfig'
import { BaseResultsByPost, BaseResultsBySite } from '@/services/results/consolidated'
import { aggregateBaseResultsByPost, computeBaseResultsByPostFromEngine } from '@/services/results/publicodes'
import { loadSituations } from '@/services/serverFunctions/situation'
import { Environment } from '@repo/db-common/enums'
import { useTranslations } from 'next-intl'
import { Situation } from 'publicodes'
import { useCallback, useEffect, useMemo, useState } from 'react'

interface UsePublicodesResultsReturn extends BaseResultsBySite {
  isLoading: boolean
  error: string | null
  refresh: () => void
}

const computeResultsForAllSitesFromSituations = (
  situations: Record<string, Situation<string>>,
  config: SimplifiedPublicodesConfig,
  tPost: (key: string) => string,
  environment: Environment,
): BaseResultsBySite => {
  const bySite = Object.entries(situations).reduce(
    (bySite, [siteId, situation]) => {
      const engine = config.getEngine().shallowCopy()
      engine.setSituation(situation)
      bySite[siteId] = computeBaseResultsByPostFromEngine(
        engine,
        config.posts,
        config.subPostsByPost,
        tPost,
        config.getPostRuleName,
        config.getSubPostRuleName,
        environment,
      )

      return bySite
    },
    {} as Record<string, BaseResultsByPost[]>,
  )

  return {
    aggregated: aggregateBaseResultsByPost(Object.values(bySite)),
    bySite,
  }
}

export function usePublicodesResults(
  study: FullStudy,
  studySite: string | 'all',
  environment: Environment,
  skipAuthCheck = false,
): UsePublicodesResultsReturn {
  const tPost = useTranslations('emissionFactors.post')
  const [situationBySiteId, setSituationsBySiteId] = useState<Record<string, Situation<string>>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const config = useMemo(() => getSimplifiedPublicodesConfig(environment as SimplifiedEnvironment), [environment])
  const studySiteIds = useMemo(() => {
    if (studySite === 'all') {
      return study.sites.map((s) => s.id).toSorted()
    }
    return [studySite]
  }, [study.sites, studySite])
  const studySiteIdsKey = useMemo(() => studySiteIds.join(','), [studySiteIds])

  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const refresh = useCallback(() => setRefreshTrigger((t) => t + 1), [])

  useEffect(() => {
    const load = async () => {
      if (studySiteIds.length === 0 || !config) {
        setIsLoading(false)
        return
      }

      try {
        setIsLoading(true)
        setError(null)

        const result = await loadSituations(study.id, studySiteIds, skipAuthCheck)
        if (!result.success) {
          throw new Error(result.errorMessage || 'Failed to load situations')
        }

        const loadedSituationBySiteId = (result.data ?? []).reduce(
          (acc, situation) => {
            if (situation.situation) {
              acc[situation.studySiteId] = situation.situation as Situation<string>
            }
            return acc
          },
          {} as Record<string, Situation<string>>,
        )

        setSituationsBySiteId(loadedSituationBySiteId)
        setIsLoading(false)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load situations')
        setIsLoading(false)
      }
    }
    load()
  }, [study.id, studySiteIdsKey, config, refreshTrigger])

  const results = useMemo(() => {
    if (!config || Object.keys(situationBySiteId).length === 0) {
      return { aggregated: [], bySite: {} }
    }
    return computeResultsForAllSitesFromSituations(situationBySiteId, config, tPost, environment)
  }, [config, situationBySiteId, tPost])

  return { ...results, isLoading, error, refresh }
}
