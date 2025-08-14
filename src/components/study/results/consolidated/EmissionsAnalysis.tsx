import Block from '@/components/base/Block'
import GlossaryModal from '@/components/modals/GlossaryModal'
import { FullStudy } from '@/db/study'
import { getResultsValues } from '@/services/study'
import { formatNumber } from '@/utils/number'
import HelpOutlineOutlinedIcon from '@mui/icons-material/HelpOutlineOutlined'
import { SiteCAUnit } from '@prisma/client'
import classNames from 'classnames'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { useMemo, useState } from 'react'
import styles from '../ResultsContainer.module.css'
import CarbonIntensities from './CarbonIntensities'
import Data from './Data'

interface Props {
  study: FullStudy
  studySite: string
  withDependencies: boolean
  validatedOnly: boolean
  caUnit?: SiteCAUnit
}

const EmissionsAnalysis = ({ study, studySite, validatedOnly, caUnit = SiteCAUnit.K }: Props) => {
  const t = useTranslations('study.results')
  const tGlossary = useTranslations('study')
  const tPost = useTranslations('emissionFactors.post')
  const tResultUnits = useTranslations('study.results.units')
  const [glossary, setGlossary] = useState('')
  const environment = study.organizationVersion.environment

  const [withDepValue, withoutDepValue, monetaryRatio, nonSpecificMonetaryRatio] = useMemo(
    () => getResultsValues(study, tPost, studySite, !!validatedOnly, environment),
    [environment, study, studySite, tPost, validatedOnly],
  )

  return (
    <Block title={t('analysis')}>
      <div className={classNames(styles.analysisContainer, 'flex')}>
        <div className="flex-col grow">
          <h3 className="text-center mb2">{t('total')}</h3>
          <div className={classNames(styles.gapped, 'flex grow')}>
            <div className="flex-col align-center">
              <Data value={formatNumber(withDepValue)} label={tResultUnits(study.resultsUnit)} />
              <span className="align-center text-center">
                {t('withDependencies')}
                <HelpOutlineOutlinedIcon
                  color="secondary"
                  className={`ml-4 ${styles.helpIcon}`}
                  onClick={() => setGlossary('withDependencies')}
                />
              </span>
            </div>
            <div className="flex-col align-center">
              <Data value={formatNumber(withoutDepValue)} label={tResultUnits(study.resultsUnit)} />
              <span className="text-center">{t('withoutDependencies')}</span>
            </div>
          </div>
          <CarbonIntensities
            study={study}
            studySite={studySite}
            withDep={withDepValue}
            withoutDep={withoutDepValue}
            caUnit={caUnit}
            setGlossary={setGlossary}
          />
        </div>
        <div className="flex-col grow">
          <h3 className="text-center mb2">{t('monetaryRatio')}</h3>
          <div className={classNames('flex')}>
            <Data value={`${formatNumber(monetaryRatio, 2)}%`} label={t('monetaryRatioEmissions')} />
            <span>{t('ofWhich')}</span>
            <Data value={`${formatNumber(nonSpecificMonetaryRatio, 2)}%`} label={t('nonSpeMonetaryRatioEmissions')} />
          </div>
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
    </Block>
  )
}

export default EmissionsAnalysis
