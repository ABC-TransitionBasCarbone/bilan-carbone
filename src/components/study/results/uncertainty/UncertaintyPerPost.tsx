import HelpIcon from '@/components/base/HelpIcon'
import Title from '@/components/base/Title'
import GlossaryModal from '@/components/modals/GlossaryModal'
import { FullStudy } from '@/db/study'
import { Post } from '@/services/posts'
import { ResultsByPost } from '@/services/results/consolidated'
import { formatEmissionFactorNumber, formatNumber } from '@/utils/number'
import { postColors, STUDY_UNIT_VALUES } from '@/utils/study'
import { ScatterMarkerProps, ScatterSeries } from '@mui/x-charts'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { useState } from 'react'
import { DrawingProps, MultilineText } from '../../charts/DrawingArea'
import ScatterChart from '../../charts/ScatterChart'
import styles from './UncertaintyPerPost.module.css'

const margin = 0.05
const Rect = ({ left, top, width, height }: DrawingProps) => (
  <rect
    x={left + (width / 2) * (1 + margin)}
    y={top + (height / 2) * margin}
    width={(width / 2) * (1 - 2 * margin)}
    height={(height / 2) * (1 - 2 * margin)}
    fill="var(--error-50)"
    opacity={0.3}
  />
)

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

  const results = computedResults
    .filter((post) => post.post !== 'total')
    .sort((postA, postB) => postB.numberOfValidatedEmissionSource - postA.numberOfValidatedEmissionSource)
  const { maxValue, maxUncertainty, maxSource } = results.reduce(
    (res, post) => ({
      maxValue: Math.max(res.maxValue, post.value),
      maxUncertainty: Math.max(res.maxUncertainty, post.uncertainty || 0),
      maxSource: Math.max(res.maxSource, post.numberOfValidatedEmissionSource),
    }),
    { maxValue: 0, maxUncertainty: 0, maxSource: 0 },
  )

  const series: ScatterSeries[] = results
    .filter((post) => !!post.uncertainty)
    .map((post) => ({
      id: post.post,
      data: [{ id: post.post, x: post.value, y: post.uncertainty as number }],
      markerSize: 50 * (post.numberOfValidatedEmissionSource / maxSource),
      valueFormatter: () =>
        `${tPost(post.post)} : ${t('total')} : ${formatEmissionFactorNumber(post.value / STUDY_UNIT_VALUES[study.resultsUnit])} ${t(`units.${study.resultsUnit}`)} - ${t('uncertainty')} : ${formatNumber(post.uncertainty, 2)}%`,
    }))

  const colors = series.map((post) => `var(--post-${postColors[post.id as Post] || 'green'}-dark)`)

  const onClose = () => {
    setMoreInfo(false)
    setGlossary(false)
  }

  const Text = ({ left, top, width, height }: DrawingProps) => (
    <MultilineText
      x={left + (width / 2) * (1 + margin)}
      y={top + height * margin}
      width={(width / 2) * (1 - margin * 2)}
      height={(height / 2) * (1 - 2 * margin)}
      className="bold text-center"
    >
      {t('prioritaryZone')}
    </MultilineText>
  )

  const Marker = ({ size, x, y, seriesId, color, ...rest }: ScatterMarkerProps) => (
    <Link href={`/etudes/${study.id}/comptabilisation/saisie-des-donnees/${seriesId}`}>
      <g x={0} y={0} transform={`translate(${x}, ${y})`} fill={color} opacity={1} {...rest}>
        <circle r={size} cx={0} cy={0} />
      </g>
    </Link>
  )

  return (
    <div className="my2">
      <Title title={t('uncertainties.perPost')} as="h4" className="flex-cc">
        <HelpIcon className="pointer" onClick={() => setGlossary(true)} label={tGlossary('title')} />
      </Title>
      <ScatterChart
        series={series}
        colors={colors}
        maxX={maxValue * 1.2}
        maxY={maxUncertainty * 1.5}
        yLabel={`${t('uncertainty')} (%)`}
        xLabel={`${t('total')} (${t(`units.${study.resultsUnit}`)})`}
        xValueFormatter={() => ''}
        yValueFormatter={() => ''}
        disableTicks
        Rect={Rect}
        Text={Text}
        CustomMarker={Marker}
      />
      {glossary && (
        <GlossaryModal glossary="uncertaintyPerPost" label="uncertaintyPerPost" t={tGlossary} onClose={onClose}>
          <div className="flex-col gapped">
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
