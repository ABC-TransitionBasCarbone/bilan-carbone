import Box from '@/components/base/Box'
import { FullStudy } from '@/db/study'
import { hasAccessToCarbonResponsibilityIntensities } from '@/services/permissions/environment'
import { useAppEnvironmentStore } from '@/store/AppEnvironment'
import { CA_UNIT_VALUES } from '@/utils/number'
import { Environment, SiteCAUnit } from '@prisma/client'
import { useTranslations } from 'next-intl'
import { useMemo } from 'react'
import CarbonIntensity from './CarbonIntensity'

interface Props {
  study: FullStudy
  studySite: string
  withDep: number
  withoutDep: number
  caUnit: SiteCAUnit
}

const CarbonIntensities = ({ study, studySite, withDep, withoutDep, caUnit }: Props) => {
  const t = useTranslations('study.results')
  const tCAUnit = useTranslations('settings.caUnit')
  const site = study.sites.find((site) => site.id === studySite)

  const { environment } = useAppEnvironmentStore()

  const noValidSite = (!site && studySite !== 'all') || (studySite === 'all' && !study.sites.length)

  const [ca, etp, volunteer, beneficiary] = useMemo(() => {
    if (noValidSite) {
      return [1, 1, 1, 1]
    }
    if (studySite === 'all') {
      return study.sites
        .reduce(
          (res, studySite) => [
            res[0] + (studySite.ca || 0),
            res[1] + (studySite.etp || 0),
            res[2] + (studySite.volunteerNumber || 0),
            res[3] + (studySite.beneficiaryNumber || 0),
          ],
          [0, 0, 0, 0],
        )
        .map((value, i) => (i === 0 ? value / CA_UNIT_VALUES[caUnit] || 1 : value || 1))
    }
    if (site) {
      return [site.ca / CA_UNIT_VALUES[caUnit], site.etp, site.volunteerNumber || 1, site.beneficiaryNumber || 1]
    }
    return [1, 1, 1, 1]
  }, [studySite])

  if (noValidSite) {
    return null
  }

  return (
    <Box className="flex-col">
      <div className="flex grow">
        <div className="grow justify-center">
          <span className="text-center bold">{t('dependencyIntensity')}</span>
        </div>
        {environment && hasAccessToCarbonResponsibilityIntensities(environment) && (
          <div className="grow justify-center">
            <span className="text-center bold">{t('responsibilityIntensity')}</span>
          </div>
        )}
      </div>
      <CarbonIntensity
        withDep={withDep}
        withoutDep={withoutDep}
        divider={ca}
        resultsUnit={study.resultsUnit}
        label={`${tCAUnit(caUnit)} ${t('intensities.budget')}`}
        testId="result-budget"
      />
      <CarbonIntensity
        withDep={withDep}
        withoutDep={withoutDep}
        divider={etp}
        resultsUnit={study.resultsUnit}
        label={t('intensities.etp')}
        testId="result-etp"
      />
      {study.organizationVersion.environment === Environment.TILT && (
        <>
          {volunteer && (
            <CarbonIntensity
              withDep={withDep}
              withoutDep={withoutDep}
              divider={volunteer}
              resultsUnit={study.resultsUnit}
              label={t('intensities.volunteer')}
              testId="result-budget"
            />
          )}

          {beneficiary && (
            <CarbonIntensity
              withDep={withDep}
              withoutDep={withoutDep}
              divider={beneficiary}
              resultsUnit={study.resultsUnit}
              label={t('intensities.beneficiary')}
              testId="result-budget"
            />
          )}
        </>
      )}
    </Box>
  )
}

export default CarbonIntensities
