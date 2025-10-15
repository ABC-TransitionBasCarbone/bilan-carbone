'use client'

import LinkButton from '@/components/base/LinkButton'
import StudyName from '@/components/study/card/StudyName'
import BarChart from '@/components/study/charts/BarChart'
import { FullStudy } from '@/db/study'
import { getDetailedEmissionResults } from '@/services/study'
import { Environment } from '@prisma/client'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import styles from './ResultsContainer.module.css'

interface Props {
  study: FullStudy
}

const StudyResultsContainerSummaryCut = ({ study }: Props) => {
  const t = useTranslations('study')
  const tPost = useTranslations('emissionFactors.post')
  const tResults = useTranslations('study.results')

  const studySite = 'all'

  const { computedResultsWithDep } = getDetailedEmissionResults(
    study,
    tPost,
    studySite,
    false,
    Environment.CUT,
    tResults,
  )

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
          results={computedResultsWithDep}
          resultsUnit={study.resultsUnit}
          height={450}
          showTitle={false}
          showLegend={false}
          showLabelsOnBars={false}
        />
      </div>
    </>
  )
}

export default StudyResultsContainerSummaryCut
