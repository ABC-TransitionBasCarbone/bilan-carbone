'use client'

import Button from '@/components/base/Button'
import { FullStudy } from '@/db/study'
import { deleteEmissionSource } from '@/services/serverFunctions/emissionSource'
import DeleteIcon from '@mui/icons-material/Delete'
import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { useCallback, useState } from 'react'
import Modal from '../modals/Modal'

interface Props {
  emissionSource: FullStudy['emissionSources'][0]
}

const DeleteEmissionSource = ({ emissionSource }: Props) => {
  const t = useTranslations('emissionSource.deleteDialog')
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [disabled, setDisabled] = useState(false)

  const onAccept = useCallback(async () => {
    try {
      setDisabled(true)
      await deleteEmissionSource(emissionSource.id)
      router.refresh()
    } finally {
      setDisabled(false)
    }
  }, [emissionSource])

  return (
    <>
      <Modal
        open={open}
        label="delete-emission-source"
        title={t('title')}
        onClose={() => setOpen(false)}
        actions={[
          { actionType: 'button', children: t('decline'), onClick: () => setOpen(false) },
          {
            actionType: 'button',
            disabled,
            children: t('accept'),
            onClick: onAccept,
            ['data-testid']: 'delete-emission-source-modale-accept',
          },
        ]}
      >
        {t('description')}
      </Modal>
      <Button
        data-testid="emission-source-delete"
        onClick={() => setOpen(true)}
        variant="contained"
        color="error"
        aria-label={t('delete')}
        title={t('delete')}
      >
        <DeleteIcon />
      </Button>
    </>
  )
}

export default DeleteEmissionSource
