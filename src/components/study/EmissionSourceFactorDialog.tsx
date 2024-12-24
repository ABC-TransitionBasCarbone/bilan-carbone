import { EmissionFactorWithMetaData } from '@/services/emissionFactors'
import { Button, Dialog, DialogActions, DialogContent, DialogTitle } from '@mui/material'
import { useTranslations } from 'next-intl'
import EmissionFactorsTable from '../emissionFactor/Table'

interface Props {
  close: () => void
  emissionFactors: EmissionFactorWithMetaData[]
  selectEmissionFactor: (emissionFactor: EmissionFactorWithMetaData) => void
}

const EmissionSourceFactorDialog = ({ close, emissionFactors, selectEmissionFactor }: Props) => {
  const t = useTranslations('emissionSource.emissionFactorDialog')
  return (
    <Dialog
      open
      aria-labelledby="emission-source-factor-dialog-title"
      aria-describedby="emission-source-factor-dialog-description"
      maxWidth="xl"
      fullWidth
    >
      <DialogTitle id="emission-source-factor-dialog-title">{t('title')}</DialogTitle>
      <DialogContent>
        <EmissionFactorsTable emissionFactors={emissionFactors} selectEmissionFactor={selectEmissionFactor} />
      </DialogContent>
      <DialogActions>
        <Button onClick={() => close()}>{t('cancel')}</Button>
      </DialogActions>
    </Dialog>
  )
}

export default EmissionSourceFactorDialog
