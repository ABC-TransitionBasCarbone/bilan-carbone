import { hasAccessToCarbonResponsibilityIntensitiesAdvanced } from '@/services/permissions/environmentAdvanced'
import { useAppEnvironmentStore } from '@/store/AppEnvironment'
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
  simplified?: boolean | null
}

const CarbonIntensity = ({ withDep, withoutDep, divider, resultsUnit, label, testId, simplified }: Props) => {
  const tResultUnits = useTranslations('study.results.units')
  const { environment } = useAppEnvironmentStore()

  return (
    <div className="flex grow mt1">
      <Data
        value={formatNumber(withDep / divider)}
        label={`${tResultUnits(resultsUnit)}/${label}`}
        testId={`dependency-${testId}`}
      />
      {environment && hasAccessToCarbonResponsibilityIntensitiesAdvanced(environment, simplified) && (
        <Data
          value={formatNumber(withoutDep / divider)}
          label={`${tResultUnits(resultsUnit)}/${label}`}
          testId={`responsibility-${testId}`}
        />
      )}
    </div>
  )
}

export default CarbonIntensity
