import Toast, { ToastColors } from '@/components/base/Toast'
import Modal from '@/components/modals/Modal'
import { AccountWithUserAndOrganization } from '@/db/account'
import { Action } from '@prisma/client'
import classNames from 'classnames'
import { useTranslations } from 'next-intl'
import { useEffect, useState } from 'react'

const emptyToast = { text: '', color: 'info' } as const
const toastPosition = { vertical: 'bottom', horizontal: 'left' } as const

interface Props {
  account: AccountWithUserAndOrganization | null
  open: boolean
  action?: Action
  onClose: () => void
}

const EditAccountModal = ({ account, open, onClose }: Props) => {
  const [toast, setToast] = useState<{ text: string; color: ToastColors }>(emptyToast)
  const t = useTranslations('admin.modal')

  useEffect(() => {}, [account])

  return (
    <>
      <Modal open={open} label="edit-account-modal" onClose={onClose}>
        <div className={classNames('px-2')}>
          <h6>{t('title')}</h6>
          <div className="mb-2">
            <strong>{t('email')}:</strong> <span>{account?.user?.email ?? '-'}</span>
          </div>
          <div className="mb-2">
            <strong>{t('role')}:</strong> <span>{account?.role ?? '-'}</span>
          </div>
          <div className="mb-2">
            <strong>{t('environment')}:</strong> <span>{account?.organizationVersion?.environment ?? '-'}</span>
          </div>
        </div>
      </Modal>
      {toast.text && (
        <Toast
          position={toastPosition}
          onClose={() => setToast(emptyToast)}
          message={toast.text}
          color={toast.color}
          toastKey="add-action-toast"
          open
        />
      )}
    </>
  )
}

export default EditAccountModal
