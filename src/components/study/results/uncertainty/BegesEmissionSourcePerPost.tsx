import { FullStudy } from '@/db/study'
import { BegesLine } from '@/services/results/beges'
import { formatEmissionFactorNumber } from '@/utils/number'
import { STUDY_UNIT_VALUES } from '@/utils/study'
import { ScatterMarkerProps, ScatterSeries } from '@mui/x-charts'
import { useTranslations } from 'next-intl'
import EmissionSourcePerPost from './EmissionSourcePerPost'

interface Props {
  study: FullStudy
  results: BegesLine[]
}

const BegesEmissionSourcePerPost = ({ study, results }: Props) => {
  const t = useTranslations('study.results')
  const tBeges = useTranslations('beges.post')

  const filteredResults = results.filter((post) => !!post.numberOfValidatedEmissionSource)
  const { maxValue, maxSource } = filteredResults.reduce(
    (res, post) => ({
      maxValue: Math.max(res.maxValue, post.total),
      maxSource: Math.max(res.maxSource, post.numberOfValidatedEmissionSource as number),
    }),
    { maxValue: 0, maxSource: 0 },
  )

  const series: ScatterSeries[] = filteredResults
    .filter((post) => !!post.uncertainty || !!post.numberOfValidatedEmissionSource)
    .map((post) => ({
      id: post.rule,
      data: [
        {
          id: post.rule,
          x: post.total,
          y: post.numberOfValidatedEmissionSource as number,
        },
      ],
      markerSize: 30,
      valueFormatter: () =>
        `${post.rule} ${tBeges(post.rule)} : ${t('total')} : ${formatEmissionFactorNumber(post.total / STUDY_UNIT_VALUES[study.resultsUnit])} ${t(`units.${study.resultsUnit}`)} - ${t('emissionSources')} : ${post.numberOfValidatedEmissionSource}`,
    }))

  const colors = series.map((post) => `var(--mui-palette-beges${post.id?.toString().split('.')[0]}-main)`)

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const Marker = ({ size, x, y, seriesId, color, isFaded, dataIndex, isHighlighted, ...rest }: ScatterMarkerProps) => {
    const iconSize = size * 0.75
    return (
      <g x={0} y={0} transform={`translate(${x}, ${y})`} fill={color} opacity={1} {...rest}>
        <circle r={iconSize} cx={0} cy={0} />
      </g>
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

export default BegesEmissionSourcePerPost
