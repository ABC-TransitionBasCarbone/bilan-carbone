'use client'

import LinkButton from '@/components/base/LinkButton'
import StudyName from '@/components/study/card/StudyName'
import BarChart from '@/components/study/charts/BarChart'
import { FullStudy } from '@/db/study'
import { CutPost } from '@/services/posts'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import styles from './ResultsContainer.module.css'

interface Props {
  study: FullStudy
}

const StudyResultsContainerSummaryCut = ({ study }: Props) => {
  const t = useTranslations('study')
  const studySite = 'all'

  return (
    <>
      <div className="justify-between mb2">
        <Link className={styles.studyNameLink} href={`/etudes/${study.id}`}>
          <StudyName name={study.name} />
        </Link>
        <LinkButton href={`/etudes/${study.id}/comptabilisation/resultats`}>{t('seeResults')}</LinkButton>
      </div>
      <div className="grow">
        <BarChart
          study={study}
          studySite={studySite}
          height={450}
          showTitle={false}
          showLegend={false}
          showLabelsOnBars={false}
          validatedOnly={false}
          postValues={CutPost}
        />
      </div>
    </>
  )
}

export default StudyResultsContainerSummaryCut
