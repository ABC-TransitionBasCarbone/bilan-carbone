import Title from '@/components/base/Title'
import { FullStudy } from '@/db/study'
import { Post } from '@/services/posts'
import { ResultsByPost } from '@/services/results/consolidated'
import { formatEmissionFactorNumber } from '@/utils/number'
import { defaultPostColor, postColors, STUDY_UNIT_VALUES } from '@/utils/study'
import { ScatterMarkerProps, ScatterSeries } from '@mui/x-charts'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { DrawingProps, MultilineText } from '../../charts/DrawingArea'
import ScatterChart from '../../charts/ScatterChart'
import PostIcon from '../../infography/icons/PostIcon'
import styles from './UncertaintyGraph.module.css'

const margin = 0.05
const Rect = ({ left, top, width, height }: DrawingProps) => (
  <>
    <rect
      x={left + (width / 2) * margin}
      y={top + (height / 2) * margin}
      width={(width / 2) * (1 - 2 * margin)}
      height={(height / 2) * (1 - 2 * margin)}
      fill="var(--error-50)"
      opacity={0.3}
    />
    <rect
      x={left + (width / 2) * (1 + margin)}
      y={top + (height / 2) * (1 + margin)}
      width={(width / 2) * (1 - 2 * margin)}
      height={(height / 2) * (1 - 2 * margin)}
      fill="var(--error-50)"
      opacity={0.3}
    />
  </>
)

interface Props {
  study: FullStudy
  computedResults: ResultsByPost[]
}

const EmissionSourcePerPost = ({ study, computedResults }: Props) => {
  const t = useTranslations('study.results')
  const tPost = useTranslations('emissionFactors.post')

  const results = computedResults.filter((post) => post.post !== 'total')
  const { maxValue, maxSource } = results.reduce(
    (res, post) => ({
      maxValue: Math.max(res.maxValue, post.value),
      maxSource: Math.max(res.maxSource, post.numberOfValidatedEmissionSource),
    }),
    { maxValue: 0, maxSource: 0 },
  )

  const series: ScatterSeries[] = results
    .filter((post) => !!post.uncertainty)
    .map((post) => ({
      id: post.post,
      data: [{ id: post.post, x: post.value, y: post.numberOfValidatedEmissionSource }],
      markerSize: 30,
      valueFormatter: () =>
        `${tPost(post.post)} : ${t('total')} : ${formatEmissionFactorNumber(post.value / STUDY_UNIT_VALUES[study.resultsUnit])} ${t(`units.${study.resultsUnit}`)} - ${t('emissionSources')} : ${post.numberOfValidatedEmissionSource}`,
    }))

  const colors = series.map((post) => `var(--post-${postColors[post.id as Post] || defaultPostColor}-light)`)

  const Text = ({ left, top, width, height }: DrawingProps) => (
    <>
      <MultilineText
        x={left + (width / 2) * margin}
        y={top + height * margin}
        width={(width / 2) * (1 - margin * 2)}
        height={(height / 2) * (1 - 2 * margin)}
        className="bold text-center"
      >
        {t('overExploredZone')}
      </MultilineText>
      <MultilineText
        x={left + (width / 2) * (1 + margin)}
        y={top + (height / 2) * (1 + 2 * margin)}
        width={(width / 2) * (1 - margin * 2)}
        height={(height / 2) * (1 - 2 * margin)}
        className="bold text-center"
      >
        {t('prioritaryZone')}
      </MultilineText>
    </>
  )

  const Marker = ({ size, x, y, seriesId, color, ...rest }: ScatterMarkerProps) => {
    const iconSize = size * 0.75
    return (
      <Link href={`/etudes/${study.id}/comptabilisation/saisie-des-donnees/${seriesId}`}>
        <g x={0} y={0} transform={`translate(${x}, ${y})`} fill={color} opacity={1} {...rest}>
          <circle r={iconSize} cx={0} cy={0} />
          <foreignObject x={-iconSize / 2} y={-iconSize / 2} width={2 * iconSize} height={2 * iconSize}>
            <PostIcon post={seriesId as Post} className={styles.icon} />
          </foreignObject>
        </g>
      </Link>
    )
  }

  return (
    <div className="my2">
      <Title title={t('postEmissionPerNumberOfSources')} as="h4" className="flex-cc" />
      <ScatterChart
        series={series}
        colors={colors}
        maxX={maxValue * 1.2}
        maxY={maxSource * 1.1}
        yLabel={t('emissionSources')}
        xLabel={`${t('total')} (${t(`units.${study.resultsUnit}`)})`}
        xValueFormatter={() => ''}
        yValueFormatter={() => ''}
        disableTicks
        Rect={Rect}
        Text={Text}
        CustomMarker={Marker}
      />
    </div>
  )
}

export default EmissionSourcePerPost
