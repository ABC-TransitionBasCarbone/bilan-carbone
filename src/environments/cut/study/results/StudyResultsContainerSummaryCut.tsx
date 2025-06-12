'use client'

import LinkButton from '@/components/base/LinkButton'
import StudyName from '@/components/study/card/StudyName'
import Result from '@/components/study/results/Result'
import { FullStudy } from '@/db/study'
import { computeResultsByPost } from '@/services/results/consolidated'
import { filterWithDependencies } from '@/services/results/utils'
import { SubPost } from '@prisma/client'
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

  const allComputedResults = useMemo(() => computeResultsByPost(study, tPost, studySite, true, false), [studySite])

  const computedResults = useMemo(
    () =>
      allComputedResults
        .map((post) => ({
          ...post,
          subPosts: post.subPosts.filter((subPost) => filterWithDependencies(subPost.post as SubPost, true)),
        }))
        .map((post) => ({ ...post, value: post.subPosts.reduce((res, subPost) => res + subPost.value, 0) })),
    [allComputedResults],
  )

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
