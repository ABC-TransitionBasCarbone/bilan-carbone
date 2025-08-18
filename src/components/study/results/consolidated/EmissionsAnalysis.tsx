import Block from '@/components/base/Block'
import GlossaryModal from '@/components/modals/GlossaryModal'
import { FullStudy } from '@/db/study'
import { formatNumber } from '@/utils/number'
import HelpOutlineOutlinedIcon from '@mui/icons-material/HelpOutlineOutlined'
import { SiteCAUnit } from '@prisma/client'
import classNames from 'classnames'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { useState } from 'react'
import styles from '../ResultsContainer.module.css'
import ResultsTableAndGraphs, { TabsPossibilities } from '../ResultsTableAndGraphs'
import CarbonIntensities from './CarbonIntensities'
import Data from './Data'

interface Props {
  study: FullStudy
  studySite: string
  withDepValue: number
  withoutDepValue: number
  monetaryRatio: number
  nonSpecificMonetaryRatio: number
  caUnit?: SiteCAUnit
}

const EmissionsAnalysis = ({
  study,
  studySite,
  withDepValue,
  withoutDepValue,
  monetaryRatio,
  nonSpecificMonetaryRatio,
  caUnit = SiteCAUnit.K,
}: Props) => {
  const t = useTranslations('study.results')
  const tGlossary = useTranslations('study')
  const tResultUnits = useTranslations('study.results.units')
  const [glossary, setGlossary] = useState('')

  return (
    <Block title={t('analysis')}>
      <div className={classNames(styles.analysisContainer, 'flex')}>
        <div className="flex-col grow">
          <h3 className="text-center mb2">{t('total')}</h3>
          <div className={classNames(styles.gapped, 'justify-center grow')}>
            <div className="flex-col align-center">
              <Data
                value={formatNumber(withDepValue)}
                label={tResultUnits(study.resultsUnit)}
                testId="withDep-total-result"
              />
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
              <Data
                value={formatNumber(withoutDepValue)}
                label={tResultUnits(study.resultsUnit)}
                testId="withoutDep-total-result"
              />
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
          <ResultsTableAndGraphs activeTabs={[TabsPossibilities.pieChart]} />
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
