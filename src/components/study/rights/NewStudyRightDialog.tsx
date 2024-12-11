import Button from '@/components/base/Button'
import { NewStudyRightStatus } from '@/services/study'
import { Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle } from '@mui/material'
import { useTranslations } from 'next-intl'

interface Props {
  rightsWarning: boolean
  status?: NewStudyRightStatus
  decline: () => void
  accept: () => void
}
const NewStudyRightDialog = ({ rightsWarning, status, decline, accept }: Props) => {
  const t = useTranslations('study.rights.new.dialog')

  return (
    <Dialog
      open={status !== undefined}
      aria-labelledby="new-study-right-dialog-title"
      aria-describedby="new-study-right-dialog-description"
    >
      <DialogTitle id="new-study-right-dialog-title">{t('title')}</DialogTitle>
      <DialogContent>
        <DialogContentText id="new-study-right-dialog-description">
          {status === NewStudyRightStatus.OtherOrganization && t('otherOrganization')}
          {rightsWarning && t('rightsWarning')}
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={decline}>{t('decline')}</Button>
        <Button onClick={accept} data-testid="new-study-right-dialog-accept">
          {t('accept')}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default NewStudyRightDialog
