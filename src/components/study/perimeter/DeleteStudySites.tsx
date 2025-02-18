'use client'

import Modal from '@/components/modals/Modal'
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
      <Modal
        open={open}
        label="delete-study-site"
        title={t('title', { count: deleting })}
        onClose={cancelDeletion}
        actions={[
          { actionType: 'button', onClick: cancelDeletion, children: t('decline') },
          {
            actionType: 'button',
            onClick: confirmDeletion,
            children: t('accept'),
            ['data-testid']: 'delete-study-site-modale-accept',
          },
        ]}
      >
        {t.rich('description', {
          count: deleting,
          warning: (children) => <span className="userWarning">{children}</span>,
        })}
      </Modal>
    </>
  )
}

export default DeleteStudySite
