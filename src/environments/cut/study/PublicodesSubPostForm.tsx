'use client'

import usePublicodesSituation from '@/components/publicodes-form/hooks/usePublicodesSituation'
import PublicodesForm from '@/components/publicodes-form/PublicodesForm'
import SaveStatusIndicator from '@/components/publicodes-form/SaveStatusIndicator'
import { PUBLICODES_COUNT_VERSION } from '@/constants/versions'
import { FullStudy } from '@/db/study'
import { useBeforeUnload } from '@/hooks/useBeforeUnload'
import { useSituationAutoSave } from '@/hooks/useSituationAutoSave'
import { loadSituation } from '@/services/serverFunctions/situation'
import { CircularProgress } from '@mui/material'
import { SubPost } from '@prisma/client'
import { useTranslations } from 'next-intl'
import { Situation } from 'publicodes'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { getCutEngine } from '../publicodes/cut-engine'
import { studySiteToSituation as studySiteInfosToSituation } from '../publicodes/studySiteToSituation'
import { getFormLayoutsForSubPost, getPublicodesTarget as getPublicodesTargetRule } from '../publicodes/subPostMapping'
import { CutSituation } from '../publicodes/types'

export interface PublicodesSubPostFormProps {
  subPost: SubPost
  study: FullStudy
  studySiteId: string
}

/**
 * Specific {@link PublicodesForm} for CUT. Target rules are determined based
 * on the given `subPost`.
 */
const PublicodesSubPostForm = ({ subPost, study, studySiteId }: PublicodesSubPostFormProps) => {
  const tCutQuestions = useTranslations('emissionFactors.post.cutQuestions')

  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [loadedSituation, setLoadedSituation] = useState<CutSituation | null>(null)

  const autoSave = useSituationAutoSave({
    studyId: study.id,
    studySiteId,
    modelVersion: PUBLICODES_COUNT_VERSION,
  })

  // Load situation from DB on mount
  useEffect(() => {
    const loadInitialSituation = async () => {
      try {
        setIsLoading(true)
        setError(null)

        const result = await loadSituation(studySiteId)
        if (!result.success) {
          throw new Error(result.errorMessage || 'Failed to load situation')
        }
        const studySite = study.sites.find((site) => site.id === studySiteId)

        setLoadedSituation({
          ...((result.data?.situation as unknown as object) ?? {}),
          ...studySiteInfosToSituation(studySite),
        })
      } catch (err) {
        console.error('Failed to load situation:', err)
        setError(err instanceof Error ? err.message : 'Failed to load situation')
      } finally {
        setIsLoading(false)
      }
    }

    loadInitialSituation()
  }, [studySiteId, study.sites])

  const cutEngine = useMemo(() => {
    const engine = getCutEngine().shallowCopy()
    if (loadedSituation) {
      engine.setSituation(loadedSituation as Situation<string>)
    }
    return engine
  }, [loadedSituation])

  const handleSituationChange = useCallback(
    (newSituation: CutSituation) => {
      autoSave.saveSituation(newSituation)
    },
    [autoSave],
  )

  const { situation, updateField } = usePublicodesSituation(cutEngine, loadedSituation ?? {}, handleSituationChange)

  useBeforeUnload({
    when: autoSave.hasUnsavedChanges,
  })

  const targetRule = getPublicodesTargetRule(subPost)
  const formLayouts = getFormLayoutsForSubPost(subPost)

  if (error) {
    return (
      <div className="error-container p-4 border border-red-300 bg-red-50 rounded">
        <h3 className="text-red-800 font-semibold mb-2">{tCutQuestions('errorLoadingQuestions')}</h3>
        <p className="text-red-600 mb-3">{error}</p>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="loading-container p-4 text-center">
        <CircularProgress />
      </div>
    )
  }

  if (targetRule === undefined) {
    return (
      <div className="no-questions-container p-4 text-center">
        <p className="text-gray-600">{tCutQuestions('noQuestions')}</p>
      </div>
    )
  }

  return (
    <div className="dynamic-subpost-form">
      <SaveStatusIndicator
        status={{
          status: autoSave.saveStatus,
          error: autoSave.error,
          lastSaved: autoSave.lastSaved,
        }}
      />
      <PublicodesForm engine={cutEngine} formLayouts={formLayouts} situation={situation} onFieldChange={updateField} />
    </div>
  )
}

export default PublicodesSubPostForm
