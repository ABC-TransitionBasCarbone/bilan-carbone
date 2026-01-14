import { FullStudy } from '@/db/study'
import { getEmissionSourceEmission } from '@/services/emissionSource'
import { EmissionFactorBase, Environment, Export } from '@prisma/client'
import { useTranslations } from 'next-intl'
import GlossaryIconModal from '../modals/GlossaryIconModal'

interface Props {
  emissionSources: FullStudy['emissionSources']
  validatedOnly?: boolean
  environment: Environment
  exports?: Export[]
}

const filterEmissionSources = (emissionSources: FullStudy['emissionSources'], base: EmissionFactorBase) =>
  emissionSources.filter(
    (emissionSource) => emissionSource.emissionFactor && emissionSource.emissionFactor.base === base,
  )
const getValue = (emissionSources: FullStudy['emissionSources'], validatedOnly: boolean, environment: Environment) =>
  emissionSources.reduce((res, emissionSource) => {
    return (
      res +
      (emissionSource.validated || !validatedOnly ? getEmissionSourceEmission(emissionSource, environment) || 0 : 0)
    )
  }, 0)

const ElectricityBaseDifference = ({ emissionSources, validatedOnly = false, environment, exports }: Props) => {
  const t = useTranslations('emissionFactors.base.difference')

  const locationSources = filterEmissionSources(emissionSources, EmissionFactorBase.LocationBased)
  const marketSources = filterEmissionSources(emissionSources, EmissionFactorBase.MarketBased)

  const locationValue = getValue(locationSources, validatedOnly, environment)
  const marketValue = getValue(marketSources, validatedOnly, environment)

  return exports && exports.includes(Export.GHGP) && locationValue !== marketValue ? (
    <>
      <div className="flex align-end mt1 warning">
        <span className="mr-2">{t('warning')}</span>
        <GlossaryIconModal
          title="title"
          iconLabel="explanation"
          label="electricity-base-difference"
          tModal="emissionFactors.base.difference"
          className="warning"
        >
          {t('description')}
        </GlossaryIconModal>
      </div>
    </>
  ) : null
}

export default ElectricityBaseDifference
