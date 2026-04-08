import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import InventoryIcon from '@mui/icons-material/Inventory'
import { EmissionFactorStatus } from '@prisma/client'
import { Getter } from '@tanstack/react-table'
import { useTranslations } from 'next-intl'

interface Props {
  getValue: Getter<string>
}
export const EmissionFactorStatusCell = ({ getValue }: Props) => {
  const t = useTranslations('emissionFactors.table')

  const status = getValue<EmissionFactorStatus>()
  const Icon =
    status === EmissionFactorStatus.Archived ? <InventoryIcon color="inherit" /> : <CheckCircleIcon color="success" />

  return (
    <div className="flex-cc" aria-label={t(status)} title={t(status)}>
      {Icon}
    </div>
  )
}
