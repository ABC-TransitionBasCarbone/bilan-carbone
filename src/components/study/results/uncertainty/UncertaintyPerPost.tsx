import HelpIcon from '@/components/base/HelpIcon'
import Title from '@/components/base/Title'
import GlossaryModal from '@/components/modals/GlossaryModal'
import { Post } from '@/services/posts'
import { ResultsByPost } from '@/services/results/consolidated'
import { formatEmissionFactorNumber, formatNumber } from '@/utils/number'
import { defaultPostColor, postColors, STUDY_UNIT_VALUES } from '@/utils/study'
import { ScatterMarkerProps, ScatterSeries } from '@mui/x-charts'
import { StudyResultUnit } from '@prisma/client'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { useState } from 'react'
import { DrawingProps, TopRightMultilineText, TopRightRect } from '../../charts/DrawingArea'
import ScatterChart from '../../charts/ScatterChart'
import PostIcon from '../../infography/icons/PostIcon'
import styles from './UncertaintyGraph.module.css'

const Rect = (props: DrawingProps) => <TopRightRect margin={0} color="var(--mui-palette-primary-light)" {...props} />

interface Props {
  studyId: string
  resultsUnit: StudyResultUnit
  computedResults: ResultsByPost[]
  validatedOnly: boolean
}

const UncertaintyPerPost = ({ studyId, resultsUnit, computedResults, validatedOnly }: Props) => {
  const t = useTranslations('study.results')
  const tPost = useTranslations('emissionFactors.post')
  const tGlossary = useTranslations('study.results.glossary')
  const [glossary, setGlossary] = useState(false)
  const [moreInfo, setMoreInfo] = useState(false)
  const numberOfSources = validatedOnly ? 'numberOfValidatedEmissionSource' : 'numberOfEmissionSource'

  const results = [...computedResults]
    .filter((post) => post.post !== 'total' && !!post.uncertainty)
    .map((post) => ({ ...post, uncertainty: 100 * ((post.uncertainty as number) - 1) }))
    .sort((postA, postB) => postB[numberOfSources] - postA[numberOfSources])

  const { maxValue, maxUncertainty, maxSource } = results.reduce(
    (res, post) => ({
      maxValue: Math.max(res.maxValue, post.value),
      maxUncertainty: Math.max(res.maxUncertainty, post.uncertainty || 0),
      maxSource: Math.max(res.maxSource, post[numberOfSources]),
    }),
    { maxValue: 0, maxUncertainty: 0, maxSource: 0 },
  )

  const series: ScatterSeries[] = results
    .filter((post) => !!post.uncertainty)
    .map((post) => ({
      id: post.post,
      data: [{ id: post.post, x: post.value, y: post.uncertainty as number }],
      markerSize: 50 * (post[numberOfSources] / maxSource),
      valueFormatter: () =>
        `${tPost(post.post)} : ${t('total')} : ${formatEmissionFactorNumber(post.value / STUDY_UNIT_VALUES[resultsUnit])} ${t(`units.${resultsUnit}`)} - ${t('uncertainty')} : ${formatNumber(post.uncertainty, 2)}%`,
    }))

  const colors = series.map((post) => `var(--post-${postColors[post.id as Post] || defaultPostColor}-light)`)

  const onClose = () => {
    setMoreInfo(false)
    setGlossary(false)
  }

  const Text = (props: DrawingProps) => (
    <TopRightMultilineText {...props} margin={0.05} className="bold text-center">
      {t('prioritaryZone')}
    </TopRightMultilineText>
  )

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const Marker = ({ size, x, y, seriesId, color, isFaded, dataIndex, isHighlighted, ...rest }: ScatterMarkerProps) => {
    const iconSize = size * 0.75
    return (
      <Link href={`/etudes/${studyId}/comptabilisation/saisie-des-donnees/${seriesId}`}>
        <g x={0} y={0} transform={`translate(${x}, ${y})`} fill={color} opacity={1} {...rest}>
          <circle r={size} cx={0} cy={0} />
          {size > 20 && (
            <foreignObject x={-iconSize / 2} y={-iconSize / 2} width={2 * iconSize} height={2 * iconSize}>
              <PostIcon post={seriesId as Post} className={styles.icon} />
            </foreignObject>
          )}
        </g>
      </Link>
    )
  }

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
        xLabel={`${t('total')} (${t(`units.${resultsUnit}`)})`}
        xValueFormatter={(value) => formatNumber(value / STUDY_UNIT_VALUES[resultsUnit], 2)}
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
