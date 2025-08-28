import Link from '@/components/base/Link'
import Title from '@/components/base/Title'
import Modal from '@/components/modals/Modal'
import { FullStudy } from '@/db/study'
import { getEmissionResults } from '@/services/emissionSource'
import { Post } from '@/services/posts'
import { qualityKeys, specificFEQualityKeysLinks } from '@/services/uncertainty'
import { formatEmissionFactorNumber, formatNumber } from '@/utils/number'
import { getPost } from '@/utils/post'
import { defaultPostColor, postColors, STUDY_UNIT_VALUES } from '@/utils/study'
import { ScatterSeries } from '@mui/x-charts'
import classNames from 'classnames'
import { useTranslations } from 'next-intl'
import { useMemo, useState } from 'react'
import { DrawingProps, TopRightMultilineText, TopRightRect } from '../../charts/DrawingArea'
import ScatterChart from '../../charts/ScatterChart'
import styles from './UncertaintyGraph.module.css'

const Rect = (props: DrawingProps) => <TopRightRect margin={0} color="var(--mui-palette-primary-light)" {...props} />

interface Props {
  study: FullStudy
}

type Serie = ScatterSeries & {
  post: Post
}

const UncertaintyPerEmissionSource = ({ study }: Props) => {
  const t = useTranslations('study.results')
  const tCaract = useTranslations('emissionSource.form')
  const tQuality = useTranslations('quality')
  const [details, setDetails] = useState('')

  const results = study.emissionSources.map((emissionSource) => ({
    id: emissionSource.id,
    name: emissionSource.name,
    value: emissionSource.value,
    post: getPost(emissionSource.subPost),
    uncertainty: getEmissionResults(emissionSource)?.alpha,
  }))

  const { maxValue, maxUncertainty } = results.reduce(
    (res, emissionSource) => ({
      maxValue: Math.max(res.maxValue, emissionSource.value || 0),
      maxUncertainty: Math.max(res.maxUncertainty, (emissionSource.uncertainty || 0) * 100),
    }),
    { maxValue: 0, maxUncertainty: 0 },
  )

  const series: Serie[] = results
    .filter((emissionSource) => !!emissionSource.value && !!emissionSource.uncertainty)
    .map((emissionSource) => ({
      id: emissionSource.id,
      data: [
        { id: emissionSource.id, x: emissionSource.value as number, y: (emissionSource.uncertainty as number) * 100 },
      ],
      markerSize: 8,
      post: emissionSource.post as Post,
      valueFormatter: () =>
        `${emissionSource.name} : ${t('total')} : ${formatEmissionFactorNumber((emissionSource.value as number) / STUDY_UNIT_VALUES[study.resultsUnit])} ${t(`units.${study.resultsUnit}`)} - ${t('uncertainty')} : ${formatNumber((emissionSource.uncertainty as number) * 100, 2)}%`,
    }))

  const colors = series.map(
    (emissionSource) => `var(--post-${postColors[emissionSource.post as Post] || defaultPostColor}-light)`,
  )

  const Text = (props: DrawingProps) => (
    <TopRightMultilineText {...props} margin={0.05} className="bold text-center">
      {t('prioritaryZone')}
    </TopRightMultilineText>
  )

  const detailedSource = useMemo(
    () => study.emissionSources.find((emissionSource) => emissionSource.id === details),
    [details, study],
  )

  return (
    <div className="my2">
      <Title title={t('uncertainties.perEmission')} as="h4" className="flex-cc" />
      <ScatterChart
        series={series}
        colors={colors}
        maxX={maxValue * 1.2}
        maxY={maxUncertainty * 1.5}
        yLabel={`${t('uncertainty')} (%)`}
        xLabel={`${t('total')} (${t(`units.${study.resultsUnit}`)})`}
        xValueFormatter={(value) => formatNumber(value / STUDY_UNIT_VALUES[study.resultsUnit], 2)}
        onClick={(emissionSource: string) => setDetails(emissionSource)}
        Rect={Rect}
        Text={Text}
      />
      {!!details && !!detailedSource && (
        <Modal open label="emission-source-details" onClose={() => setDetails('')} title={detailedSource.name}>
          <div className={classNames(styles.gapped, 'flex-col')}>
            <div className={classNames(styles.gapped, 'flex-row')}>
              <div className="flex-col grow">
                <p className="bold mb-2">{tCaract('activity')}</p>
                <ul>
                  {qualityKeys
                    .filter((key) => !!detailedSource[key])
                    .map((key) => (
                      <li key={key}>
                        {tCaract(key)} : {tQuality((detailedSource[key] as number).toString())}
                      </li>
                    ))}
                </ul>
              </div>
              <div className="flex-col grow">
                <p className="bold mb-2">{tCaract('emissionFactor')}</p>
                <ul>
                  {qualityKeys
                    .filter(
                      (key) =>
                        !!detailedSource[specificFEQualityKeysLinks[key]] || !!detailedSource.emissionFactor?.[key],
                    )
                    .map((key) => (
                      <li key={key}>
                        {tCaract(key)} :{' '}
                        {tQuality(
                          (
                            (detailedSource[specificFEQualityKeysLinks[key]] ||
                              detailedSource.emissionFactor?.[key]) as number
                          ).toString(),
                        )}
                      </li>
                    ))}
                </ul>
              </div>
            </div>
            <Link
              href={`/etudes/${study.id}/comptabilisation/saisie-des-donnees/${getPost(detailedSource.subPost)}#emission-source-${detailedSource.id}`}
              className="justify-center"
            >
              {tCaract('see')}
            </Link>
          </div>
        </Modal>
      )}
    </div>
  )
}

export default UncertaintyPerEmissionSource
