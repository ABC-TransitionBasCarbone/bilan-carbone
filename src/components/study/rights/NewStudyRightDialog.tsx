import Button from '@/components/base/Button'
import { Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle } from '@mui/material'
import { useTranslations } from 'next-intl'

interface Props {
  otherOrganization: boolean
  rightsWarning: boolean
  decline: () => void
  accept: () => void
}
const NewStudyRightDialog = ({ otherOrganization, rightsWarning, decline, accept }: Props) => {
  const t = useTranslations('study.rights.new.dialog')

  return (
    <Dialog
      open={otherOrganization}
      aria-labelledby="new-study-right-dialog-title"
      aria-describedby="new-study-right-dialog-description"
    >
      <DialogTitle id="new-study-right-dialog-title">{t('title')}</DialogTitle>
      <DialogContent>
        <DialogContentText id="new-study-right-dialog-description">
          {t('otherOrganization')}
          {rightsWarning && t('rightsWarning')}
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={decline} data-testid="new-study-right-dialog-decline">
          {t('decline')}
        </Button>
        <Button onClick={accept} data-testid="new-study-right-dialog-accept">
          {t('accept')}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default NewStudyRightDialog
