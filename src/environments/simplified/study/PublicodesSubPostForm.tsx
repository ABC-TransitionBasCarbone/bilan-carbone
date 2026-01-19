'use client'

import { SubPost } from '@/components/dynamic-form/types/questionTypes'
import PublicodesForm from '@/components/publicodes-form/PublicodesForm'
import { getSimplifiedPublicodesConfig } from '@/services/publicodes/simplifiedPublicodesConfig'
import { CircularProgress } from '@mui/material'
import { Environment } from '@prisma/client'
import classNames from 'classnames'
import { useTranslations } from 'next-intl'
import styles from './PublicodesSubPostForm.module.css'

export interface PublicodesSubPostFormProps {
  environment: Environment
  subPost: SubPost
}

const PublicodesSubPostForm = ({ subPost, environment }: PublicodesSubPostFormProps) => {
  const tQuestions = useTranslations('emissionFactors.post.questions')
  // TODO: handle the case where config is undefined
  const config = getSimplifiedPublicodesConfig(environment)!
  const { engine, situation, updateField, isLoading, error } = config.usePublicodesForm()
  const formLayouts = config.getFormLayout(subPost)

  if (error) {
    return (
      <div className={classNames(styles.errorContainer, 'p1')}>
        <h3 className={classNames(styles.errorTitle, 'mb-2')}>{tQuestions('errorLoadingQuestions')}</h3>
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
        <p className={styles.noQuestionsMessage}>{tQuestions('noQuestions')}</p>
      </div>
    )
  }

  if (!situation) {
    return null
  }

  return <PublicodesForm engine={engine} formLayouts={formLayouts} situation={situation} onFieldChange={updateField} />
}

export default PublicodesSubPostForm
