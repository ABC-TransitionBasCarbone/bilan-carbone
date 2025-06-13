'use client'

import LinkButton from '@/components/base/LinkButton'
import StudyName from '@/components/study/card/StudyName'
import Result from '@/components/study/results/Result'
import { FullStudy } from '@/db/study'
import { computeResultsByPost } from '@/services/results/consolidated'
import { mapResultsByPost } from '@/services/results/utils'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { useMemo } from 'react'
import styles from './ResultsContainer.module.css'

interface Props {
  study: FullStudy
  studySite: string
}

const StudyResultsContainerSummaryCut = ({ study, studySite }: Props) => {
  const tPost = useTranslations('emissionFactors.post')
  const t = useTranslations('study')

  const allComputedResults = useMemo(
    () => computeResultsByPost(study, tPost, studySite, true, false),
    [study, tPost, studySite],
  )

  const computedResults = useMemo(() => mapResultsByPost(allComputedResults, true), [allComputedResults])

  return (
    <>
      <div className="justify-between mb2">
        <Link className={styles.studyNameLink} href={`/etudes/${study.id}`}>
          <StudyName name={study.name} />
        </Link>
        <LinkButton href={`/etudes/${study.id}/comptabilisation/resultats`}>{t('seeResults')}</LinkButton>
      </div>
      <Result studySite={studySite} computedResults={computedResults} resultsUnit={study.resultsUnit} />
    </>
  )
}

export default StudyResultsContainerSummaryCut
