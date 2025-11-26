import { EmissionFactorList } from '@/db/emissionFactors'
import { EmissionFactorWithMetaData } from '@/services/serverFunctions/emissionFactor'
import CheckIcon from '@mui/icons-material/Check'
import { Button as MuiButton } from '@mui/material'
import { useTranslations } from 'next-intl'

interface Props {
  emissionFactor: EmissionFactorList
  selectEmissionFactor: (emissionFactor: EmissionFactorWithMetaData) => void
}
export const EmissionFactorActionCell = ({ emissionFactor, selectEmissionFactor }: Props) => {
  const t = useTranslations('emissionFactors.table')

  return (
    <MuiButton
      aria-label={t('selectLine')}
      title={t('selectLine')}
      onClick={() => selectEmissionFactor(emissionFactor)}
      color="secondary"
      variant="contained"
    >
      <CheckIcon />
    </MuiButton>
  )
}
