import { FullStudy } from '@/db/study'
import { EmissionFactorBase, Export, Unit } from '@prisma/client'
import classNames from 'classnames'
import { useTranslations } from 'next-intl'
import GlossaryIconModal from '../modals/GlossaryIconModal'

interface Props {
  emissionSources: FullStudy['emissionSources']
  validatedOnly?: boolean
  exports?: Export[]
  className?: string
}

const filterEmissionSources = (emissionSources: FullStudy['emissionSources'], base: EmissionFactorBase) =>
  emissionSources.filter(
    (emissionSource) => emissionSource.emissionFactor && emissionSource.emissionFactor.base === base,
  )
const getValue = (emissionSources: FullStudy['emissionSources'], validatedOnly: boolean) =>
  emissionSources.reduce(
    (res, emissionSource) =>
      res +
      ((emissionSource.validated || !validatedOnly) && emissionSource.emissionFactor?.unit === Unit.KWH
        ? emissionSource.value || 0
        : 0),
    0,
  )

const ElectricityBaseDifference = ({ emissionSources, validatedOnly = false, exports, className }: Props) => {
  const t = useTranslations('emissionFactors.base.difference')

  const locationSources = filterEmissionSources(emissionSources, EmissionFactorBase.LocationBased)
  const marketSources = filterEmissionSources(emissionSources, EmissionFactorBase.MarketBased)

  const locationValue = getValue(locationSources, validatedOnly)
  const marketValue = getValue(marketSources, validatedOnly)

  return exports && exports.includes(Export.GHGP) && locationValue !== marketValue ? (
    <div className={classNames(className, 'flex warning')}>
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
  ) : null
}

export default ElectricityBaseDifference
