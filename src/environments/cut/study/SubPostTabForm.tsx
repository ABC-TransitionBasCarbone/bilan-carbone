import { QCM } from '@/components/questions/QCM'
import { FullStudy } from '@/db/study'
import { getEmissionSourcesByStudyId } from '@/services/serverFunctions/emissionSource'
import { SubPost } from '@prisma/client'
import { useTranslations } from 'next-intl'
import { useCallback, useEffect, useState } from 'react'
import { subPostQuestions, subPostSubtitle } from '../services/post'
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

  console.log(questions)
  return (
    <div>
      <div className={styles.container}>
        {subPostSubtitle?.[subPost] && <p className="title-h5 mt2 ml1">{tCutQuestions(subPostSubtitle[subPost])}</p>}
        {questions.map((question) =>
          question.type === 'qcm' ? (
            <QCM question={question} key={question.key} />
          ) : (
            <SubPostField
              key={question.key}
              isLoading={isLoading}
              question={question}
              emissionSources={newEmissionSources}
              study={study}
              subPost={subPost}
              callback={refetchEmissionSources}
            />
          ),
        )}
      </div>
    </div>
  )
}

export default SubPostTabForm
