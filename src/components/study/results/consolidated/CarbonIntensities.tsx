import { FullStudy } from '@/db/study'
import { CA_UNIT_VALUES } from '@/utils/number'
import HelpOutlineOutlinedIcon from '@mui/icons-material/HelpOutlineOutlined'
import { Environment, SiteCAUnit } from '@prisma/client'
import { useTranslations } from 'next-intl'
import styles from '../ResultsContainer.module.css'
import CarbonIntensity from './CarbonIntensity'

interface Props {
  study: FullStudy
  studySite: string
  withDep: number
  withoutDep: number
  caUnit: SiteCAUnit
  setGlossary: (glossary: string) => void
}

const CarbonIntensities = ({ study, studySite, withDep, withoutDep, caUnit, setGlossary }: Props) => {
  const t = useTranslations('study.results')
  const tCAUnit = useTranslations('settings.caUnit')
  const site = study.sites.find((site) => site.id === studySite)
  if (!site) {
    return null
  }

  return (
    <div className="flex-col mt1">
      <div className="flex grow">
        <span className="text-center align-center grow bold">
          {t('dependencyIntensity')}
          <HelpOutlineOutlinedIcon
            color="secondary"
            className={`ml-4 ${styles.helpIcon}`}
            onClick={() => setGlossary('dependencyIntensity')}
          />
        </span>
        <span className="text-center align-center grow bold">
          {t('responsabilityIntensity')}
          <HelpOutlineOutlinedIcon
            color="secondary"
            className={`ml-4 ${styles.helpIcon}`}
            onClick={() => setGlossary('responsabilityIntensity')}
          />
        </span>
      </div>
      <CarbonIntensity
        withDep={withDep}
        withoutDep={withoutDep}
        divider={site.ca / CA_UNIT_VALUES[caUnit]}
        resultsUnit={study.resultsUnit}
        label={`${tCAUnit(caUnit)} ${t('intensities.budget')}`}
      />
      <CarbonIntensity
        withDep={withDep}
        withoutDep={withoutDep}
        divider={site.etp}
        resultsUnit={study.resultsUnit}
        label={t('intensities.etp')}
      />
      {study.organizationVersion.environment === Environment.TILT && (
        <>
          {site.volunteerNumber && (
            <CarbonIntensity
              withDep={withDep}
              withoutDep={withoutDep}
              divider={site.volunteerNumber}
              resultsUnit={study.resultsUnit}
              label={t('intensities.volunteer')}
            />
          )}

          {site.beneficiaryNumber && (
            <CarbonIntensity
              withDep={withDep}
              withoutDep={withoutDep}
              divider={site.beneficiaryNumber}
              resultsUnit={study.resultsUnit}
              label={t('intensities.beneficiary')}
            />
          )}
        </>
      )}
    </div>
  )
}

export default CarbonIntensities
