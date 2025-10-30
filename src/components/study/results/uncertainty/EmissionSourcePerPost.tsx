import Title from '@/components/base/Title'
import { Post } from '@/services/posts'
import { ResultsByPost } from '@/services/results/consolidated'
import { formatEmissionFactorNumber, formatNumber } from '@/utils/number'
import { defaultPostColor, postColors, STUDY_UNIT_VALUES } from '@/utils/study'
import { ScatterMarkerProps, ScatterSeries } from '@mui/x-charts'
import { StudyResultUnit } from '@prisma/client'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import {
  BottomRightMultilineText,
  BottomRightRect,
  DrawingProps,
  TopLeftMultilineText,
  TopLeftRect,
} from '../../charts/DrawingArea'
import ScatterChart from '../../charts/ScatterChart'
import PostIcon from '../../infography/icons/PostIcon'
import styles from './UncertaintyGraph.module.css'

const Rect = (props: DrawingProps) => (
  <>
    <TopLeftRect margin={0} color="var(--mui-palette-primary-light)" {...props} />
    <BottomRightRect margin={0} color="var(--mui-palette-primary-light)" {...props} />
  </>
)

interface Props {
  studyId: string
  resultsUnit: StudyResultUnit
  results: ResultsByPost[]
  validatedOnly: boolean
}

const EmissionSourcePerPost = ({ studyId, resultsUnit, results, validatedOnly }: Props) => {
  const t = useTranslations('study.results')
  const tPost = useTranslations('emissionFactors.post')

  const filteredResults = results.filter((post) => post.post !== 'total')
  const numberOfSources = validatedOnly ? 'numberOfValidatedEmissionSource' : 'numberOfEmissionSource'
  const { maxValue, maxSource } = filteredResults.reduce(
    (res, post) => ({
      maxValue: Math.max(res.maxValue, post.value),
      maxSource: Math.max(res.maxSource, post[numberOfSources] as number),
    }),
    { maxValue: 0, maxSource: 0 },
  )

  const series: ScatterSeries[] = filteredResults
    .filter((post) => !!post.uncertainty || !!post[numberOfSources])
    .map((post) => ({
      id: post.post,
      data: [
        {
          id: post.post,
          x: post.value,
          y: post[numberOfSources] as number,
        },
      ],
      markerSize: 30,
      valueFormatter: () =>
        `${tPost(post.post)} : ${t('total')} : ${formatEmissionFactorNumber(post.value / STUDY_UNIT_VALUES[resultsUnit])} ${t(`units.${resultsUnit}`)} - ${t('emissionSources')} : ${post[numberOfSources]}`,
    }))

  const colors = series.map((post) => `var(--post-${postColors[post.id as Post] || defaultPostColor}-light)`)

  const Text = (props: DrawingProps) => (
    <>
      <TopLeftMultilineText {...props} margin={0.05} className="bold text-center">
        {t('nonPrioritaryZone')}
      </TopLeftMultilineText>
      <BottomRightMultilineText {...props} margin={0.05} className="bold text-center">
        {t('prioritaryZone')}
      </BottomRightMultilineText>
    </>
  )

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const Marker = ({ size, x, y, seriesId, color, isFaded, dataIndex, isHighlighted, ...rest }: ScatterMarkerProps) => {
    const iconSize = size * 0.75
    return (
      <Link href={`/etudes/${studyId}/comptabilisation/saisie-des-donnees/${seriesId}`}>
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
        xLabel={`${t('total')} (${t(`units.${resultsUnit}`)})`}
        xValueFormatter={(value) => formatNumber(value / STUDY_UNIT_VALUES[resultsUnit], 2)}
        Rect={Rect}
        Text={Text}
        CustomMarker={Marker}
      />
    </div>
  )
}

export default EmissionSourcePerPost
