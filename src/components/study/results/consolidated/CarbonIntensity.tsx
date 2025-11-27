import { formatNumber } from '@/utils/number'
import { useTranslations } from 'next-intl'
import Data from './Data'

interface Props {
  withDep: number
  withoutDep: number
  divider: number
  resultsUnit: string
  label: string
  testId: string
  withoutResponsability?: boolean
}

const CarbonIntensity = ({
  withDep,
  withoutDep,
  divider,
  resultsUnit,
  label,
  testId,
  withoutResponsability = false,
}: Props) => {
  const tResultUnits = useTranslations('study.results.units')
  return (
    <div className="flex grow mt1">
      <Data
        value={formatNumber(withDep / divider)}
        label={`${tResultUnits(resultsUnit)}/${label}`}
        testId={`dependency-${testId}`}
      />
      {!withoutResponsability && (
        <Data
          value={formatNumber(withoutDep / divider)}
          label={`${tResultUnits(resultsUnit)}/${label}`}
          testId={`responsability-${testId}`}
        />
      )}
    </div>
  )
}

export default CarbonIntensity
