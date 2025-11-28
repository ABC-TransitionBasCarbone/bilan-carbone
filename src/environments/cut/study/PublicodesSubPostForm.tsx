'use client'

import PublicodesForm from '@/components/publicodes-form/PublicodesForm'
import SaveStatusIndicator from '@/components/publicodes-form/SaveStatusIndicator'
import { PUBLICODES_COUNT_VERSION } from '@/constants/versions'
import { useBeforeUnload } from '@/hooks/useBeforeUnload'
import { usePublicodesAutoSave } from '@/hooks/usePublicodesAutoSave'
import { loadSituation } from '@/services/serverFunctions/publicodes'
import CircularProgress from '@mui/material/CircularProgress'
import { SubPost } from '@prisma/client'
import { FormState } from '@publicodes/forms'
import { useTranslations } from 'next-intl'
import { Situation } from 'publicodes'
import { useCallback, useEffect, useState } from 'react'
import { getCutFormBuilder } from '../publicodes/cut-engine'
import { getPublicodesTarget as getPublicodesTargetRule } from '../publicodes/subPostMapping'
import { CutRuleName, CutSituation } from '../publicodes/types'

export interface PublicodesSubPostFormProps {
  studyId: string
  studySiteId: string
  subPost: SubPost
}

/**
 * Specific {@link PublicodesForm} for CUT. Target rules are determined based
 * on the given `subPost`.
 */
const PublicodesSubPostForm = ({ studyId, studySiteId, subPost }: PublicodesSubPostFormProps) => {
  const tCutQuestions = useTranslations('emissionFactors.post.cutQuestions')
  const autoSave = usePublicodesAutoSave({
    studyId,
    studySiteId,
    modelVersion: PUBLICODES_COUNT_VERSION,
  })

  const cutFormBuilder = getCutFormBuilder()
  const targetRule = getPublicodesTargetRule(subPost)

  const [situation, setSituation] = useState<CutSituation>({})
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const handleFieldChange = useCallback(
    (_fieldName: any, _value: any, newState: FormState<string>) => {
      autoSave.saveSituation(newState.situation)
    },
    [autoSave],
  )

  const constLoadSituation = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)

      const result = await loadSituation(studySiteId)
      if (!result.success) {
        throw new Error(result.errorMessage || 'Failed to load situation')
      }

      // TODO: manage model/publicodes versioning compatibility
      setSituation((result.data?.situation ?? {}) as CutSituation)
    } catch (err) {
      console.error('Failed to load situation:', err)
      setError(err instanceof Error ? err.message : 'Failed to load situation')
    } finally {
      setIsLoading(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [studySiteId])

  useEffect(() => {
    constLoadSituation()
  }, [constLoadSituation, studySiteId])

  useBeforeUnload({
    when: autoSave.hasUnsavedChanges,
  })

  if (error) {
    return (
      <div className="error-container p-4 border border-red-300 bg-red-50 rounded">
        <h3 className="text-red-800 font-semibold mb-2">{tCutQuestions('errorLoadingQuestions')}</h3>
        <p className="text-red-600 mb-3">{error}</p>
        <button
          /* TODO: allow to retry loading questions
           * onClick={loadQuestionsAndAnswers} */
          className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700"
        >
          {tCutQuestions('retry')}
        </button>
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

  // TODO: better error message
  if (targetRule === undefined) {
    return (
      <div className="no-questions-container p-4 text-center">
        <p className="text-gray-600">{tCutQuestions('noQuestions')}</p>
      </div>
    )
  }

  return (
    <div className="dynamic-subpost-form">
      {autoSave && (
        <SaveStatusIndicator
          status={{
            status: autoSave.saveStatus,
            error: autoSave.error,
            lastSaved: autoSave.lastSaved,
          }}
        />
      )}

      <PublicodesForm
        formBuilder={cutFormBuilder}
        targetRules={[targetRule]}
        initialSituation={situation as Situation<CutRuleName>}
        onFieldChange={handleFieldChange}
      />
    </div>
  )
}

export default PublicodesSubPostForm
