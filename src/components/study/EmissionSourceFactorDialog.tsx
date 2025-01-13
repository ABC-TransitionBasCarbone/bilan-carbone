import { EmissionFactorWithMetaData } from '@/services/emissionFactors'
import CloseIcon from '@mui/icons-material/Close'
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, IconButton } from '@mui/material'
import { useTranslations } from 'next-intl'
import EmissionFactorsTable from '../emissionFactor/Table'

interface Props {
  close: () => void
  open: boolean
  emissionFactors: EmissionFactorWithMetaData[]
  selectEmissionFactor: (emissionFactor: EmissionFactorWithMetaData) => void
}

const EmissionSourceFactorDialog = ({ close, open, emissionFactors, selectEmissionFactor }: Props) => {
  const t = useTranslations('emissionSource.emissionFactorDialog')
  return (
    <Dialog
      open={open}
      aria-labelledby="emission-source-factor-dialog-title"
      aria-describedby="emission-source-factor-dialog-description"
      maxWidth="xl"
      fullWidth
      onClose={close}
    >
      <DialogTitle id="emission-source-factor-dialog-title">{t('title')}</DialogTitle>
      <IconButton
        aria-label="close"
        onClick={close}
        sx={(theme) => ({
          position: 'absolute',
          right: 8,
          top: 8,
          color: theme.palette.grey[500],
        })}
      >
        <CloseIcon />
      </IconButton>
      <DialogContent>
        <EmissionFactorsTable emissionFactors={emissionFactors} selectEmissionFactor={selectEmissionFactor} />
      </DialogContent>
      <DialogActions>
        <Button onClick={close}>{t('cancel')}</Button>
      </DialogActions>
    </Dialog>
  )
}

export default EmissionSourceFactorDialog
