import PublicodesForm from '@/components/dynamic-form-publicodes/PublicodesForm'
import { FullStudy } from '@/db/study'
import { CircularProgress } from '@mui/material'
import { SubPost } from '@prisma/client'
import { useTranslations } from 'next-intl'
import { useState } from 'react'
import { getCutEngine } from '../publicodes/cut-engine'
import { getPublicodesTarget as getPublicodesTargetRule } from '../publicodes/subPostMapping'

export interface PublicodesSubPostFormProps {
  subPost: SubPost
  study: FullStudy
  studySiteId: string
}

const PublicodesSubPostForm = ({ subPost, study, studySiteId }: PublicodesSubPostFormProps) => {
  const tCutQuestions = useTranslations('emissionFactors.post.cutQuestions')

  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const cutEngine = getCutEngine()
  const targetRule = getPublicodesTargetRule(subPost)

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
      <PublicodesForm
        engine={cutEngine}
        targetRules={[targetRule]}
        // TODO: manage autosave answers
        // subPost={subPost}
        // studyId={study.id}
        // studySiteId={studySiteId}
        // studyStartDate={study.startDate}

        // TODO: manage initial answers
        // initialSituation={{}}
      />
    </div>
  )
}

export default PublicodesSubPostForm
