'use client'

import PublicodesForm from '@/components/publicodes-form/PublicodesForm'
import { CircularProgress } from '@mui/material'
import { SubPost } from '@prisma/client'
import classNames from 'classnames'
import { useTranslations } from 'next-intl'
import { useCutPublicodes } from '../context/publicodesContext'
import { getFormLayoutsForSubPostCUT } from '../publicodes/subPostMapping'
import styles from './PublicodesSubPostForm.module.css'

export interface PublicodesSubPostFormProps {
  subPost: SubPost
}

const PublicodesSubPostForm = ({ subPost }: PublicodesSubPostFormProps) => {
  const tCutQuestions = useTranslations('emissionFactors.post.cutQuestions')
  const { engine, situation, updateField, isLoading, error } = useCutPublicodes()
  const formLayouts = getFormLayoutsForSubPostCUT(subPost)

  if (error) {
    return (
      <div className={classNames(styles.errorContainer, 'p1')}>
        <h3 className={classNames(styles.errorTitle, 'mb-2')}>{tCutQuestions('errorLoadingQuestions')}</h3>
        <p className={styles.errorMessage}>{error}</p>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className={classNames(styles.loadingContainer, 'p1')}>
        <CircularProgress />
      </div>
    )
  }

  if (formLayouts === undefined) {
    return (
      <div className={classNames(styles.loadingContainer, 'p1')}>
        <p className={styles.noQuestionsMessage}>{tCutQuestions('noQuestions')}</p>
      </div>
    )
  }

  if (!situation) {
    return null
  }

  return <PublicodesForm engine={engine} formLayouts={formLayouts} situation={situation} onFieldChange={updateField} />
}

export default PublicodesSubPostForm
