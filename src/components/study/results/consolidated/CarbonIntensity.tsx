import { formatNumber } from '@/utils/number'
import { useTranslations } from 'next-intl'
import Data from './Data'

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
        <Data key={i} value={formatNumber(emission / divider)} label={`${tResultUnits(resultsUnit)}/${label}`} />
      ))}
    </div>
  )
}

export default CarbonIntensity
