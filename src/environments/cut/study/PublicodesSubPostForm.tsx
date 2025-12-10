'use client'

import PublicodesForm from '@/components/publicodes-form/PublicodesForm'
import { CircularProgress } from '@mui/material'
import { SubPost } from '@prisma/client'
import { useTranslations } from 'next-intl'
import { useCutPublicodes } from '../context/CutPublicodesProvider'
import { getFormLayoutsForSubPost } from '../publicodes/subPostMapping'

export interface PublicodesSubPostFormProps {
  subPost: SubPost
}

const PublicodesSubPostForm = ({ subPost }: PublicodesSubPostFormProps) => {
  const tCutQuestions = useTranslations('emissionFactors.post.cutQuestions')
  const { engine, situation, updateField, isLoading, error } = useCutPublicodes()
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

  if (formLayouts === undefined) {
    return (
      <div className="no-questions-container p-4 text-center">
        <p className="text-gray-600">{tCutQuestions('noQuestions')}</p>
      </div>
    )
  }

  if (!situation) {
    return null
  }

  return (
    <div className="dynamic-subpost-form">
      <PublicodesForm engine={engine} formLayouts={formLayouts} situation={situation} onFieldChange={updateField} />
    </div>
  )
}

export default PublicodesSubPostForm
