'use client'
import { FullStudy } from '@/db/study'
import {
  getSimplifiedPublicodesConfig,
  SimplifiedPublicodesConfig,
} from '@/services/publicodes/simplifiedPublicodesConfig'
import { BaseResultsByPost } from '@/services/results/consolidated'
import { aggregateBaseResultsByPost, computeBaseResultsByPostFromEngine } from '@/services/results/publicodes'
import { loadSituations } from '@/services/serverFunctions/situation'
import { Environment } from '@prisma/client'
import { useTranslations } from 'next-intl'
import { Situation } from 'publicodes'
import { useEffect, useMemo, useState } from 'react'

interface UsePublicodesResultsReturn {
  aggregatedResults: BaseResultsByPost[]
  resultsBySiteId: Record<string, BaseResultsByPost[]>
  isLoading: boolean
  error: string | null
}

const computeResultsForAllSitesFromSituations = (
  situations: Record<string, Situation<string>>,
  config: SimplifiedPublicodesConfig,
  tPost: (key: string) => string,
): Pick<UsePublicodesResultsReturn, 'aggregatedResults' | 'resultsBySiteId'> => {
  const resultsBySiteId = Object.entries(situations).reduce(
    (resultsBySiteId, [siteId, situation]) => {
      const engine = config.getEngine().shallowCopy()
      engine.setSituation(situation)
      resultsBySiteId[siteId] = computeBaseResultsByPostFromEngine(
        engine,
        config.posts,
        config.subPostsByPost,
        tPost,
        config.getPostRuleName,
        config.getSubPostRuleName,
      )

      return resultsBySiteId
    },
    {} as Record<string, BaseResultsByPost[]>,
  )

  return {
    aggregatedResults: aggregateBaseResultsByPost(Object.values(resultsBySiteId)),
    resultsBySiteId,
  }
}

export function usePublicodesResults(
  study: FullStudy,
  studySite: string | 'all',
  environment: Environment,
): UsePublicodesResultsReturn {
  const tPost = useTranslations('emissionFactors.post')
  const [situationBySiteId, setSituationsBySiteId] = useState<Record<string, Situation<string>>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const config = useMemo(() => getSimplifiedPublicodesConfig(environment), [environment])
  const studySiteIds = useMemo(() => {
    if (studySite === 'all') {
      return study.sites.map((s) => s.id).toSorted()
    }
    return [studySite]
  }, [study.sites, studySite])
  const studySiteIdsKey = useMemo(() => studySiteIds.join(','), [studySiteIds])

  useEffect(() => {
    const load = async () => {
      if (studySiteIds.length === 0 || !config) {
        setIsLoading(false)
        return
      }

      try {
        setIsLoading(true)
        setError(null)

        const result = await loadSituations(study.id, studySiteIds)
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
  }, [study.id, studySiteIdsKey, config])

  const results = useMemo(() => {
    if (!config || Object.keys(situationBySiteId).length === 0) {
      return { aggregatedResults: [], resultsBySiteId: {} }
    }
    return computeResultsForAllSitesFromSituations(situationBySiteId, config, tPost)
  }, [config, situationBySiteId, tPost])

  return { ...results, isLoading, error }
}
