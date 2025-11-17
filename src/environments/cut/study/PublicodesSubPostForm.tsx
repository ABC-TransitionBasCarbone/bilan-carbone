import DynamicForm from '@/components/dynamic-form/DynamicForm'
import { FullStudy } from '@/db/study'
import { CircularProgress } from '@mui/material'
import { Answer, Question, SubPost } from '@prisma/client'
import { useTranslations } from 'next-intl'
import { useState } from 'react'

interface Props {
  subPost: SubPost
  study: FullStudy
  studySiteId: string
}

const PublicodesSubPostForm = ({ subPost, study, studySiteId }: Props) => {
  const tCutQuestions = useTranslations('emissionFactors.post.cutQuestions')

  const [questions, setQuestions] = useState<Question[]>([])
  const [answers, setAnswers] = useState<Answer[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

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

export default PublicodesSubPostForm
