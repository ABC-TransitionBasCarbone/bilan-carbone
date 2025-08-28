import Title from '@/components/base/Title'
import { ScatterMarkerProps, ScatterSeries } from '@mui/x-charts'
import { useTranslations } from 'next-intl'
import { ReactNode } from 'react'
import {
  BottomRightMultilineText,
  BottomRightRect,
  DrawingProps,
  TopLeftMultilineText,
  TopLeftRect,
} from '../../charts/DrawingArea'
import ScatterChart from '../../charts/ScatterChart'

const margin = 0.05
const Rect = (props: DrawingProps) => (
  <>
    <TopLeftRect margin={margin} color="var(--error-50)" {...props} />
    <BottomRightRect margin={margin} color="var(--error-50)" {...props} />
  </>
)

interface Props {
  series: ScatterSeries[]
  colors: string[]
  maxX: number
  maxY: number
  resultsUnit: string
  Marker: (props: ScatterMarkerProps) => ReactNode
}

const EmissionSourcePerPost = ({ series, colors, maxX, maxY, resultsUnit, Marker }: Props) => {
  const t = useTranslations('study.results')

  const Text = (props: DrawingProps) => (
    <>
      <TopLeftMultilineText {...props} margin={margin} className="bold text-center">
        {t('overExploredZone')}
      </TopLeftMultilineText>
      <BottomRightMultilineText {...props} margin={margin} className="bold text-center">
        {t('prioritaryZone')}
      </BottomRightMultilineText>
    </>
  )

  return (
    <div className="my2">
      <Title title={t('postEmissionPerNumberOfSources')} as="h4" className="flex-cc" />
      <ScatterChart
        series={series}
        colors={colors}
        maxX={maxX}
        maxY={maxY}
        yLabel={t('emissionSources')}
        xLabel={`${t('total')} (${t(`units.${resultsUnit}`)})`}
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
