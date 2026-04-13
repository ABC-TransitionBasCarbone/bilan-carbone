import CarbonIntensity from '@/components/study/results/consolidated/CarbonIntensity'
import type { FullStudy } from '@/db/study'
import { StudyResultUnit } from '@repo/db-common/enums'
import { useTranslations } from 'next-intl'
import { useMemo } from 'react'
import styles from './ResultsContainer.module.css'

interface Props {
  study: FullStudy
  studySite: string
  withDepValue: number
}

const CarbonIntensitiesCut = ({ study, studySite, withDepValue }: Props) => {
  const t = useTranslations('study.results')
  const site = study.sites.find((site) => site.id === studySite)

  const [screens, entries, superficy, sessions, movies, chairs] = useMemo(() => {
    if (studySite === 'all') {
      return study.sites
        .reduce(
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
        .map((value) => (value === 0 ? 1 : value)) // to avoid division by zero
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
      key: 'chairs',
      divider: chairs,
      unit: StudyResultUnit.T,
      label: t('intensities.chair'),
    },
    {
      key: 'screens',
      divider: screens,
      unit: StudyResultUnit.T,
      label: t('intensities.screen'),
    },
    {
      key: 'superficy',
      divider: superficy,
      unit: StudyResultUnit.T,
      label: t('intensities.superficy'),
    },
    {
      key: 'entries',
      divider: entries,
      unit: StudyResultUnit.T,
      label: t('intensities.entrie'),
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
  ]

  return (
    <div className={styles.resultsContainer}>
      <div className="flex grow gapped2 wrap justify-start">
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
