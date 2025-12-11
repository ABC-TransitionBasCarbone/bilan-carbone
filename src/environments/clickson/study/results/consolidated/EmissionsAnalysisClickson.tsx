import Box from '@/components/base/Box'
import Title from '@/components/base/Title'
import GlossaryModal from '@/components/modals/GlossaryModal'
import styles from '@/components/study/results/ResultsContainer.module.css'
import CarbonIntensity from '@/components/study/results/consolidated/CarbonIntensity'
import Data from '@/components/study/results/consolidated/Data'
import { FullStudy } from '@/db/study'
import { hasAccessToMonetaryRatio } from '@/services/permissions/environment'
import { useAppEnvironmentStore } from '@/store/AppEnvironment'
import { formatNumber } from '@/utils/number'
import { SiteCAUnit } from '@prisma/client'
import classNames from 'classnames'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { useMemo, useState } from 'react'

interface Props {
  study: FullStudy
  studySite: string
  withDepValue: number
  monetaryRatio: number
  nonSpecificMonetaryRatio: number
  caUnit?: SiteCAUnit
}

const EmissionsAnalysisClickson = ({
  study,
  studySite,
  withDepValue,
  monetaryRatio,
  nonSpecificMonetaryRatio,
  caUnit = SiteCAUnit.K,
}: Props) => {
  const t = useTranslations('study.results')
  const tGlossary = useTranslations('study')
  const tResultUnits = useTranslations('study.results.units')
  const tCAUnit = useTranslations('settings.caUnit')
  const [glossary, setGlossary] = useState('')

  const { environment } = useAppEnvironmentStore()

  const studentAndEmployees = useMemo(() => {
    return study.sites.reduce((res, studySite) => res + (studySite.studentNumber || 0) + (studySite.etp || 0), 0) || 1
  }, [studySite])

  return (
    <div className="mb2">
      <Title title={t('analysis')} as="h3" className="mb1" />
      <div className={classNames(styles.analysisContainer, 'flex')}>
        <div className="flex-col grow gapped2">
          <Box className={classNames(styles.gapped, 'justify-center flex-col')}>
            <Title as="h6" title={t('total')} className="justify-center" />
            <div className="flex-row justify-around">
              <Data
                value={formatNumber(withDepValue)}
                label={tResultUnits(study.resultsUnit)}
                testId="withDep-total-result"
              />
            </div>
          </Box>
          <Box className="flex-col">
            <div className="flex grow">
              <div className="grow justify-center">
                <span className="text-center bold">{t('dependencyIntensity')}</span>
              </div>
            </div>
            <CarbonIntensity
              withDep={withDepValue}
              withoutDep={0}
              divider={studentAndEmployees}
              resultsUnit={study.resultsUnit}
              label={`${tCAUnit(caUnit)} ${t('intensities.studentEmployee')}`}
              testId="result-student-employee"
            />
          </Box>
        </div>
        <div className="flex-col grow">
          {environment && hasAccessToMonetaryRatio(environment) && (
            <Box className="mb2">
              <Title as="h6" title={t('monetaryRatio')} className="justify-center" />
              <div className={classNames('flex')}>
                <Data
                  value={`${formatNumber(monetaryRatio, 2)}%`}
                  label={t('monetaryRatioEmissions')}
                  testId="results-monetary-ratio"
                />
                <span>{t('ofWhich')}</span>
                <Data
                  value={`${formatNumber(nonSpecificMonetaryRatio, 2)}%`}
                  label={t('nonSpeMonetaryRatioEmissions')}
                  testId="results-non-spe-monetary-ratio"
                />
              </div>
            </Box>
          )}
        </div>
      </div>
      {glossary && (
        <GlossaryModal glossary={glossary} label="results-analysis" t={t} onClose={() => setGlossary('')}>
          <span>
            {tGlossary.rich(`${glossary}Description`, {
              link: (children) => (
                <Link
                  href="https://www.bilancarbone-methode.com/annexes/annexes/annexe-1-grands-principes-de-comptabilisation-du-bilan-carbone-r#zoom-sur-les-sous-postes-utilisation-en-responsabilite-et-utilisation-en-dependance"
                  target="_blank"
                  rel="noreferrer noopener"
                >
                  {children}
                </Link>
              ),
            })}
          </span>
        </GlossaryModal>
      )}
    </div>
  )
}

export default EmissionsAnalysisClickson
