'use client'

import Button from '@/components/base/Button'
import { Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle } from '@mui/material'
import { useTranslations } from 'next-intl'

interface Props {
  open: boolean
  setOpen: (open: boolean) => void
  siteToDelete: string | null
  confirmDeletion: (siteId: string) => void
  cancelDeletion: () => void
}

const DeleteStudySite = ({ open, setOpen, siteToDelete, confirmDeletion, cancelDeletion }: Props) => {
  const t = useTranslations('study.perimeter.deleteDialog')

  const deleteSite = () => {
    if (siteToDelete) {
      confirmDeletion(siteToDelete)
      setOpen(false)
    }
  }

  return (
    <>
      <Dialog
        open={open}
        aria-labelledby="delete-study-site-dialog-title"
        aria-describedby="delete-study-site-dialog-description"
      >
        <DialogTitle id="delete-study-site-dialog-title">{t('title')}</DialogTitle>
        <DialogContent>
          <DialogContentText id="delete-study-site-dialog-description">{t('description')}</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={cancelDeletion}>{t('decline')}</Button>
          <Button onClick={deleteSite} data-testid="delete-study-site-dialog-accept">
            {t('accept')}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}

export default DeleteStudySite
