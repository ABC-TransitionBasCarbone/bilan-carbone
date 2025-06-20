import { QCM } from '@/components/questions/QCM'
import { QCU } from '@/components/questions/QCU'
import { FullStudy } from '@/db/study'
import { getEmissionSourcesByStudyId } from '@/services/serverFunctions/emissionSource'
import { SubPost } from '@prisma/client'
import { useTranslations } from 'next-intl'
import { useCallback, useEffect, useState } from 'react'
import { Question, subPostQuestions, subPostSubtitle } from '../services/post'
import SubPostField from './SubPostField'
import styles from './SubPostTabForm.module.css'

interface Props {
  subPost: SubPost
  emissionSources?: FullStudy['emissionSources']
  study: FullStudy
}

const SubPostTabForm = ({ subPost, emissionSources, study }: Props) => {
  const tCutQuestions = useTranslations('cutQuestions')
  const questions = subPostQuestions[subPost] || []
  const [newEmissionSources, setNewEmissionSources] = useState(emissionSources)

  const [isLoading, setIsLoading] = useState(true)

  const refetchEmissionSources = useCallback(async () => {
    const refetchedEmissionSources = await getEmissionSourcesByStudyId(study.id)
    if (refetchedEmissionSources.success) {
      setNewEmissionSources(refetchedEmissionSources.data)
    }
    setIsLoading(false)
  }, [study])

  useEffect(() => {
    setIsLoading(true)
    refetchEmissionSources()
  }, [])

  const getQuestionComponent = useCallback(
    (question: Question) => {
      switch (question.type) {
        case 'qcm':
          return <QCM question={question} key={question.key} />
        case 'qcu':
          return <QCU question={question} key={question.key} />
        default:
          return (
            <SubPostField
              key={question.key}
              isLoading={isLoading}
              question={question}
              emissionSources={newEmissionSources}
              study={study}
              subPost={subPost}
              callback={refetchEmissionSources}
            />
          )
      }
    },
    [isLoading, newEmissionSources, refetchEmissionSources, study, subPost],
  )

  return (
    <div>
      <div className={styles.container}>
        {subPostSubtitle?.[subPost] && <p className="title-h5 mt2 ml1">{tCutQuestions(subPostSubtitle[subPost])}</p>}
        {questions.map((question) => getQuestionComponent(question))}
      </div>
    </div>
  )
}

export default SubPostTabForm
