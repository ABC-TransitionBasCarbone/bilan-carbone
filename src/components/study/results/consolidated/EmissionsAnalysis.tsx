import Box from '@/components/base/Box'
import Title from '@/components/base/Title'
import GlossaryModal from '@/components/modals/GlossaryModal'
import { FullStudy } from '@/db/study'
import { ResultsByTag } from '@/services/results/consolidated'
import { formatNumber } from '@/utils/number'
import HelpOutlineOutlinedIcon from '@mui/icons-material/HelpOutlineOutlined'
import { SiteCAUnit } from '@prisma/client'
import classNames from 'classnames'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { useState } from 'react'
import styles from '../ResultsContainer.module.css'
import ResultsTableAndGraphs from '../ResultsTableAndGraphs'
import TagsResultsTable from '../tags/TagsResultsTable'
import CarbonIntensities from './CarbonIntensities'
import Data from './Data'

interface Props {
  study: FullStudy
  studySite: string
  withDepValue: number
  withoutDepValue: number
  displayValueWithDep: boolean
  setDisplayValueWithDep: (displayValueWithDep: boolean) => void
  monetaryRatio: number
  nonSpecificMonetaryRatio: number
  caUnit?: SiteCAUnit
  computedResultsByTag: ResultsByTag[]
}

const EmissionsAnalysis = ({
  study,
  studySite,
  withDepValue,
  withoutDepValue,
  displayValueWithDep,
  setDisplayValueWithDep,
  monetaryRatio,
  nonSpecificMonetaryRatio,
  caUnit = SiteCAUnit.K,
  computedResultsByTag,
}: Props) => {
  const t = useTranslations('study.results')
  const tGlossary = useTranslations('study')
  const tResultUnits = useTranslations('study.results.units')
  const [glossary, setGlossary] = useState('')

  return (
    <div className="mb2">
      <Title title={t('analysis')} as="h3" className="mb1" />
      <div className={classNames(styles.analysisContainer, 'flex')}>
        <div className="flex-col grow gapped2">
          <Box className={classNames(styles.gapped, 'justify-center flex-col')}>
            <Title as="h6" title={t('total')} className="justify-center" />
            <div className="flex-row justify-around">
              <Box
                className="pointer align-center flex-col relative mr1"
                color="secondary"
                selected={displayValueWithDep}
                onClick={() => setDisplayValueWithDep(true)}
              >
                <HelpOutlineOutlinedIcon
                  color="secondary"
                  className={`ml-4 ${styles.helpIcon} absolute r1`}
                  onClick={() => setGlossary('withDependencies')}
                />
                <Data
                  value={formatNumber(withDepValue)}
                  label={tResultUnits(study.resultsUnit)}
                  testId="withDep-total-result"
                />
                <span className="align-center text-center">{t('withDependencies')}</span>
              </Box>
              <Box
                className="pointer align-center flex-col"
                color="secondary"
                selected={!displayValueWithDep}
                onClick={() => setDisplayValueWithDep(false)}
              >
                <Data
                  value={formatNumber(withoutDepValue)}
                  label={tResultUnits(study.resultsUnit)}
                  testId="withoutDep-total-result"
                />
                <span className="text-center">{t('withoutDependencies')}</span>
              </Box>
            </div>
          </Box>
          <CarbonIntensities
            study={study}
            studySite={studySite}
            withDep={withDepValue}
            withoutDep={withoutDepValue}
            caUnit={caUnit}
          />
        </div>
        <div className="flex-col grow">
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
          <ResultsTableAndGraphs
            computedResults={computedResultsByTag}
            resultsUnit={study.resultsUnit}
            TableComponent={TagsResultsTable}
            title={t('tagPieChartTitle', { unit: tResultUnits(study.resultsUnit) })}
            type="tag"
            glossary="tagGlossary"
          />
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

export default EmissionsAnalysis
