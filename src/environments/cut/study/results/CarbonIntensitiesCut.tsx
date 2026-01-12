import CarbonIntensity from '@/components/study/results/consolidated/CarbonIntensity'
import Data from '@/components/study/results/consolidated/Data'
import { FullStudy } from '@/db/study'
import { CA_UNIT_VALUES, formatNumber } from '@/utils/number'
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

  const [etp, screens, entries, superficy, sessions, movies, chairs, ca] = useMemo(() => {
    if (studySite === 'all') {
      return study.sites
        .reduce(
          (res, studySite) => [
            res[0] + (studySite.etp || 0),
            res[1] + (studySite.site.cnc?.ecrans || 0),
            res[2] + (studySite.numberOfTickets || 0),
            res[3] + (studySite.superficy || 0),
            res[4] + (studySite.numberOfSessions || 0),
            res[5] + (studySite.site.cnc?.numberOfProgrammedFilms || 0),
            res[6] + (studySite.site.cnc?.fauteuils || 0),
            res[7] + (studySite.ca || 0),
          ],
          [0, 0, 0, 0, 0, 0, 0, 0],
        )
        .map((value, i) => (i === 8 ? value / CA_UNIT_VALUES[caUnit] || 1 : value || 1))
    }
    if (site) {
      return [
        site.etp || 1,
        site.site.cnc?.ecrans || 1,
        site.numberOfTickets || 1,
        site.superficy || 1,
        site.numberOfSessions || 1,
        site.site.cnc?.numberOfProgrammedFilms || 1,
        site.site.cnc?.fauteuils || 1,
        site.ca / CA_UNIT_VALUES[caUnit],
      ]
    }
    return [1, 1, 1, 1, 1, 1, 1, 1]
  }, [studySite])

  return (
    <div className={'flex'}>
      <div className="flex grow gapped2 wrap justify-center">
        <div className={styles.carbonIntensityContainer}>
          <div className="flex grow mt1">
            <Data
              value={formatNumber(withDepValue)}
              label={tResultUnits(StudyResultUnit.T)}
              testId="withDep-total-result"
            />
          </div>
        </div>
        <div className={styles.carbonIntensityContainer}>
          <CarbonIntensity
            withDep={withDepValue}
            withoutDep={0}
            divider={etp}
            resultsUnit={StudyResultUnit.T}
            label={t('intensities.etp')}
            testId="result-etp"
          />
        </div>
        <div className={styles.carbonIntensityContainer}>
          <CarbonIntensity
            withDep={withDepValue}
            withoutDep={0}
            divider={screens}
            resultsUnit={StudyResultUnit.T}
            label={t('intensities.screen')}
            testId="result-screens"
          />
        </div>
        <div className={styles.carbonIntensityContainer}>
          <CarbonIntensity
            withDep={withDepValue}
            withoutDep={0}
            divider={entries}
            resultsUnit={StudyResultUnit.K}
            label={t('intensities.entrie')}
            testId="result-entries"
          />
        </div>
        <div className={styles.carbonIntensityContainer}>
          <CarbonIntensity
            withDep={withDepValue}
            withoutDep={0}
            divider={superficy}
            resultsUnit={StudyResultUnit.K}
            label={t('intensities.superficy')}
            testId="result-superficy"
          />
        </div>
        <div className={styles.carbonIntensityContainer}>
          <CarbonIntensity
            withDep={withDepValue}
            withoutDep={0}
            divider={sessions}
            resultsUnit={StudyResultUnit.K}
            label={t('intensities.session')}
            testId="result-sessions"
          />
        </div>
        <div className={styles.carbonIntensityContainer}>
          <CarbonIntensity
            withDep={withDepValue}
            withoutDep={0}
            divider={movies}
            resultsUnit={StudyResultUnit.K}
            label={t('intensities.movie')}
            testId="result-movies"
          />
        </div>
        <div className={styles.carbonIntensityContainer}>
          <CarbonIntensity
            withDep={withDepValue}
            withoutDep={0}
            divider={chairs}
            resultsUnit={StudyResultUnit.K}
            label={t('intensities.chair')}
            testId="result-chairs"
          />
        </div>
        <div className={styles.carbonIntensityContainer}>
          <CarbonIntensity
            withDep={withDepValue}
            withoutDep={0}
            divider={ca}
            resultsUnit={StudyResultUnit.K}
            label={t('intensities.ca')}
            testId="result-ca"
          />
        </div>
      </div>
    </div>
  )
}

export default CarbonIntensitiesCut
