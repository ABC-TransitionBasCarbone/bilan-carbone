import HelpIcon from '@/components/base/HelpIcon'
import Title from '@/components/base/Title'
import GlossaryModal from '@/components/modals/GlossaryModal'
import { FullStudy } from '@/db/study'
import { Post } from '@/services/posts'
import { ResultsByPost } from '@/services/results/consolidated'
import { formatEmissionFactorNumber, formatNumber } from '@/utils/number'
import { postColors, STUDY_UNIT_VALUES } from '@/utils/study'
import { ScatterSeries } from '@mui/x-charts'
import classNames from 'classnames'
import { useTranslations } from 'next-intl'
import { useState } from 'react'
import ScatterChart from '../../charts/ScatterChart'
import styles from './UncertaintyPerPost.module.css'

interface Props {
  study: FullStudy
  computedResults: ResultsByPost[]
}

const UncertaintyPerPost = ({ study, computedResults }: Props) => {
  const t = useTranslations('study.results')
  const tPost = useTranslations('emissionFactors.post')
  const tGlossary = useTranslations('study.results.glossary')
  const [glossary, setGlossary] = useState(false)
  const [moreInfo, setMoreInfo] = useState(false)

  const results = computedResults.filter((post) => post.post !== 'total')
  const [maxValue, maxUncertainty, maxSource] = results.reduce(
    (res, post) => [
      Math.max(res[0], post.value),
      Math.max(res[1], post.uncertainty || 0),
      Math.max(res[2], post.numberOfValidatedEmissionSource),
    ],
    [0, 0, 0],
  )

  const series: ScatterSeries[] = computedResults
    .filter((post) => !!post.uncertainty)
    .map((post) => ({
      data: [{ id: post.post, x: post.value, y: post.uncertainty as number }],
      markerSize: 50 * (post.numberOfValidatedEmissionSource / maxSource),
      valueFormatter: () =>
        `${tPost(post.post)} : ${t('total')} : ${formatEmissionFactorNumber(post.value / STUDY_UNIT_VALUES[study.resultsUnit])} ${t(`units.${study.resultsUnit}`)} - ${t('uncertainty')} : ${formatNumber(post.uncertainty, 2)}%`,
    }))

  const colors = series.map((post) => `var(--post-${postColors[post.id as Post] || 'green'}-dark)`)

  return (
    <div className="my2">
      <Title title={t('uncertainties.perPost')} as="h4" className="flex-cc">
        <HelpIcon className="pointer" onClick={() => setGlossary(true)} label={tGlossary('label')} />
      </Title>
      <ScatterChart
        series={series}
        colors={colors}
        maxX={maxValue * 1.2}
        maxY={maxUncertainty * 1.5}
        yLabel={`${t('uncertainty')} (%)`}
        xLabel={`${t('total')} (${t(`units.${study.resultsUnit}`)})`}
        xValueFormatter={(value: number) => formatNumber(value / STUDY_UNIT_VALUES[study.resultsUnit])}
      />
      {glossary && (
        <GlossaryModal
          glossary="uncertaintyPerPost"
          label="uncertaintyPerPost"
          t={tGlossary}
          onClose={() => setGlossary(false)}
        >
          <div className={classNames(styles.gapped, 'flex-col')}>
            <p>{tGlossary('uncertaintyPerPostDescription')}</p>
            {moreInfo ? (
              <p>{tGlossary('uncertaintyPerPostDescription2')}</p>
            ) : (
              <span className={styles.moreInfoButton} onClick={() => setMoreInfo(!moreInfo)}>
                {tGlossary('more')}
              </span>
            )}
          </div>
        </GlossaryModal>
      )}
    </div>
  )
}

export default UncertaintyPerPost
