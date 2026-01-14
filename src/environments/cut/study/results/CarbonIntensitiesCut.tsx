import CarbonIntensity from '@/components/study/results/consolidated/CarbonIntensity'
import Data from '@/components/study/results/consolidated/Data'
import { FullStudy } from '@/db/study'
import { formatNumber } from '@/utils/number'
import { SiteCAUnit, StudyResultUnit } from '@prisma/client'
import { useTranslations } from 'next-intl'
import { useMemo } from 'react'
import styles from './ResultsContainer.module.css'

interface Props {
  study: FullStudy
  studySite: string
  withDepValue: number
  caUnit?: SiteCAUnit
}

const CarbonIntensitiesCut = ({ study, studySite, withDepValue, caUnit = SiteCAUnit.K }: Props) => {
  const t = useTranslations('study.results')
  const tResultUnits = useTranslations('study.results.units')
  const site = study.sites.find((site) => site.id === studySite)

  const [screens, entries, superficy, sessions, movies, chairs] = useMemo(() => {
    if (studySite === 'all') {
      return study.sites.reduce(
        (res, studySite) => [
          res[0] + (studySite.site.cnc?.ecrans || 0),
          res[1] + (studySite.numberOfTickets || 0),
          res[2] + (studySite.superficy || 0),
          res[3] + (studySite.numberOfSessions || 0),
          res[4] + (studySite.site.cnc?.numberOfProgrammedFilms || 0),
          res[5] + (studySite.site.cnc?.fauteuils || 0),
        ],
        [0, 0, 0, 0, 0, 0],
      )
    }
    if (site) {
      return [
        site.site.cnc?.ecrans || 1,
        site.numberOfTickets || 1,
        site.superficy || 1,
        site.numberOfSessions || 1,
        site.site.cnc?.numberOfProgrammedFilms || 1,
        site.site.cnc?.fauteuils || 1,
      ]
    }
    return [1, 1, 1, 1, 1, 1]
  }, [studySite])

  const intensities = [
    {
      key: 'screens',
      divider: screens,
      unit: StudyResultUnit.T,
      label: t('intensities.screen'),
    },
    {
      key: 'entries',
      divider: entries,
      unit: StudyResultUnit.T,
      label: t('intensities.entrie'),
    },
    {
      key: 'superficy',
      divider: superficy,
      unit: StudyResultUnit.T,
      label: t('intensities.superficy'),
    },
    {
      key: 'sessions',
      divider: sessions,
      unit: StudyResultUnit.T,
      label: t('intensities.session'),
    },
    {
      key: 'movies',
      divider: movies,
      unit: StudyResultUnit.T,
      label: t('intensities.movie'),
    },
    {
      key: 'chairs',
      divider: chairs,
      unit: StudyResultUnit.T,
      label: t('intensities.chair'),
    },
  ]

  return (
    <div className={styles.resultsContainer}>
      <div className="flex grow gapped2 wrap justify-start">
        <div className={styles.carbonIntensityContainer}>
          <div className="flex grow mt1">
            <Data
              value={formatNumber(withDepValue)}
              label={tResultUnits(StudyResultUnit.T)}
              testId="withDep-total-result"
            />
          </div>
        </div>
        {intensities.map(({ key, divider, unit, label }) => (
          <div key={key} className={styles.carbonIntensityContainer}>
            <CarbonIntensity
              withDep={withDepValue}
              withoutDep={0}
              divider={divider}
              resultsUnit={unit}
              label={label}
              testId={`result-${key}`}
            />
          </div>
        ))}
      </div>
    </div>
  )
}

export default CarbonIntensitiesCut
