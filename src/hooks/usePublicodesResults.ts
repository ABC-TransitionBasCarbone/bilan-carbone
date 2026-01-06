'use client'
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
  results: BaseResultsByPost[]
  isLoading: boolean
  error: string | null
}

const computeResultsFromSituations = (
  situations: Situation<string>[],
  config: SimplifiedPublicodesConfig,
  tPost: (key: string) => string,
): BaseResultsByPost[] => {
  const allResults = situations.map((situation) => {
    const engine = config.getEngine().shallowCopy()
    engine.setSituation(situation)
    return computeBaseResultsByPostFromEngine(
      engine,
      config.posts,
      config.subPostsByPost,
      tPost,
      config.getPostRuleName,
      config.getSubPostRuleName,
    )
  })
  return allResults.length <= 1 ? (allResults[0] ?? []) : aggregateBaseResultsByPost(allResults)
}

export function usePublicodesResults(
  studyId: string,
  studySiteIds: string[],
  environment: Environment,
): UsePublicodesResultsReturn {
  const tPost = useTranslations('emissionFactors.post')
  const [situations, setSituations] = useState<Situation<string>[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const config = useMemo(() => getSimplifiedPublicodesConfig(environment), [environment])

  useEffect(() => {
    const load = async () => {
      if (studySiteIds.length === 0 || !config) {
        setIsLoading(false)
        return
      }

      try {
        setIsLoading(true)
        setError(null)

        const result = await loadSituations(studyId, studySiteIds)
        if (!result.success) {
          throw new Error(result.errorMessage || 'Failed to load situations')
        }

        const loadedSituations = (result.data ?? []).map((s) => s.situation as Situation<string>).filter(Boolean)
        setSituations(loadedSituations)
        setIsLoading(false)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load situations')
        setIsLoading(false)
      }
    }
    load()
  }, [studyId, studySiteIds, config])

  const results = useMemo(() => {
    if (!config || situations.length === 0) {
      return []
    }
    return computeResultsFromSituations(situations, config, tPost)
  }, [config, situations, tPost])

  return { results, isLoading, error }
}
