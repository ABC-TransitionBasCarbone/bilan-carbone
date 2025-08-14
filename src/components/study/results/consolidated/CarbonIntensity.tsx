import { formatNumber } from '@/utils/number'
import { useTranslations } from 'next-intl'

interface Props {
  withDep: number
  withoutDep: number
  divider: number
  resultsUnit: string
  label: string
}

const CarbonIntensity = ({ withDep, withoutDep, divider, resultsUnit, label }: Props) => {
  const tResultUnits = useTranslations('study.results.units')
  return (
    <div className="flex grow mt1">
      {[withDep, withoutDep].map((emission, i) => (
        <div key={i} className="grow">
          <h2 className="text-center">{formatNumber(emission / divider)}</h2>
          <h4 className="text-center">
            {tResultUnits(resultsUnit)}/{label}
          </h4>
        </div>
      ))}
    </div>
  )
}

export default CarbonIntensity
