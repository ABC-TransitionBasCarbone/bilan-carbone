'use client'

import Button from '@/components/base/Button'
import { Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle } from '@mui/material'
import { useTranslations } from 'next-intl'

interface Props {
  open: boolean
  confirmDeletion: () => void
  cancelDeletion: () => void
  deleting: number
}

const DeleteStudySite = ({ open, confirmDeletion, cancelDeletion, deleting }: Props) => {
  const t = useTranslations('study.perimeter.deleteDialog')

  return (
    <>
      <Dialog
        open={open}
        aria-labelledby="delete-study-site-dialog-title"
        aria-describedby="delete-study-site-dialog-description"
      >
        <DialogTitle id="delete-study-site-dialog-title">{t('title', { count: deleting })}</DialogTitle>
        <DialogContent>
          <DialogContentText id="delete-study-site-dialog-description">
            {t('description', { count: deleting })}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={cancelDeletion}>{t('decline')}</Button>
          <Button onClick={confirmDeletion} data-testid="delete-study-site-dialog-accept">
            {t('accept')}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}

export default DeleteStudySite
