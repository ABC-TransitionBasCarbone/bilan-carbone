import { FullStudy } from '@/db/study'
import { Post } from '@/services/posts'
import { ResultsByPost } from '@/services/results/consolidated'
import { formatEmissionFactorNumber } from '@/utils/number'
import { defaultPostColor, postColors, STUDY_UNIT_VALUES } from '@/utils/study'
import { ScatterMarkerProps, ScatterSeries } from '@mui/x-charts'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import PostIcon from '../../infography/icons/PostIcon'
import EmissionSourcePerPost from './EmissionSourcePerPost'
import styles from './UncertaintyGraph.module.css'

interface Props {
  study: FullStudy
  results: ResultsByPost[]
}

const ConsolatedEmissionSourcePerPost = ({ study, results }: Props) => {
  const t = useTranslations('study.results')
  const tPost = useTranslations('emissionFactors.post')

  const filteredResults = results.filter((post) => post.post !== 'total')
  const { maxValue, maxSource } = filteredResults.reduce(
    (res, post) => ({
      maxValue: Math.max(res.maxValue, post.value),
      maxSource: Math.max(res.maxSource, post.numberOfValidatedEmissionSource as number),
    }),
    { maxValue: 0, maxSource: 0 },
  )

  const series: ScatterSeries[] = filteredResults
    .filter((post) => !!post.uncertainty || !!post.numberOfValidatedEmissionSource)
    .map((post) => ({
      id: post.post,
      data: [
        {
          id: post.post,
          x: post.value,
          y: post.numberOfValidatedEmissionSource as number,
        },
      ],
      markerSize: 30,
      valueFormatter: () =>
        `${tPost(post.post)} : ${t('total')} : ${formatEmissionFactorNumber(post.value / STUDY_UNIT_VALUES[study.resultsUnit])} ${t(`units.${study.resultsUnit}`)} - ${t('emissionSources')} : ${post.numberOfValidatedEmissionSource}`,
    }))

  const colors = series.map((post) => `var(--post-${postColors[post.id as Post] || defaultPostColor}-light)`)

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const Marker = ({ size, x, y, seriesId, color, isFaded, dataIndex, isHighlighted, ...rest }: ScatterMarkerProps) => {
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
    <EmissionSourcePerPost
      series={series}
      colors={colors}
      maxX={maxValue * 1.2}
      maxY={maxSource * 1.1}
      resultsUnit={study.resultsUnit}
      Marker={Marker}
    />
  )
}

export default ConsolatedEmissionSourcePerPost
