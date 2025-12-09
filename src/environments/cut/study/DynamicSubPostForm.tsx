import DynamicForm from '@/components/dynamic-form/DynamicForm'
import { FullStudy } from '@/db/study'
import { formatDynamicLabel } from '@/services/interpolation'
import { getQuestionsWithAnswers } from '@/services/serverFunctions/question'
import { CircularProgress } from '@mui/material'
import { Answer, Question, SubPost } from '@prisma/client'
import { useTranslations } from 'next-intl'
import { useCallback, useEffect, useState } from 'react'

interface Props {
  subPost: SubPost
  study: FullStudy
  studySiteId: string
}

const DynamicSubPostForm = ({ subPost, study, studySiteId }: Props) => {
  const tCutQuestions = useTranslations('emissionFactors.post.questions')

  const [questions, setQuestions] = useState<Question[]>([])
  const [answers, setAnswers] = useState<Answer[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadQuestionsAndAnswers = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)

      const result = await getQuestionsWithAnswers(subPost, studySiteId)

      if (!result.success) {
        throw new Error(result.errorMessage || 'Failed to load questions and answers')
      }

      const { questions: loadedQuestions, answers: loadedAnswers } = result.data

      // Update the label of each question by replacing the placeholder 'en * ?'
      // with the actual study start year, e.g., 'en 2024 ?'
      const updatedQuestions = loadedQuestions.map((question) => ({
        ...question,
        label: formatDynamicLabel(question.label, { study }),
      }))
      setQuestions(updatedQuestions)
      setAnswers(loadedAnswers)
    } catch (err) {
      console.error('Failed to load questions and answers:', err)
      setError(err instanceof Error ? err.message : 'Failed to load questions')
    } finally {
      setIsLoading(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subPost, studySiteId, study.startDate])

  useEffect(() => {
    loadQuestionsAndAnswers()
    // Do not add loadQuestionsAndAnswers otherWise tables are broken
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [studySiteId])

  if (error) {
    return (
      <div className="error-container p-4 border border-red-300 bg-red-50 rounded">
        <h3 className="text-red-800 font-semibold mb-2">{tCutQuestions('errorLoadingQuestions')}</h3>
        <p className="text-red-600 mb-3">{error}</p>
        <button onClick={loadQuestionsAndAnswers} className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700">
          {tCutQuestions('retry')}
        </button>
      </div>
    )
  }

  if (isLoading && questions.length === 0) {
    return (
      <div className="loading-container p-4 text-center">
        <CircularProgress />
      </div>
    )
  }

  if (questions.length === 0) {
    return (
      <div className="no-questions-container p-4 text-center">
        <p className="text-gray-600">{tCutQuestions('noQuestions')}</p>
      </div>
    )
  }

  return (
    <div className="dynamic-subpost-form">
      <DynamicForm
        questions={questions}
        subPost={subPost}
        studyId={study.id}
        studySiteId={studySiteId}
        initialAnswers={answers}
        isLoading={isLoading}
        studyStartDate={study.startDate}
      />
    </div>
  )
}

export default DynamicSubPostForm
