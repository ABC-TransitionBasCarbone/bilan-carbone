import { CRUserChecklist, Organization, UserCheckedStep } from '@prisma/client'
import classNames from 'classnames'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { useMemo } from 'react'
import Stepper from '../base/Stepper'
import Modal from '../modals/Modal'
import styles from './Checklist.module.css'
import ChecklistItem from './ChecklistItem'

const FAQLink = process.env.NEXT_PUBLIC_ABC_FAQ_LINK || ''

interface Props {
  open: boolean
  setOpen: (open: boolean) => void
  userChecklist: UserCheckedStep[]
  userOrganization: Organization
  organizations: Organization[]
  studyId?: string
}

const ChecklistModal = ({ open, setOpen, userOrganization, organizations, userChecklist, studyId }: Props) => {
  const t = useTranslations('checklist')
  const steps = useMemo(() => (userOrganization.isCR ? CRUserChecklist : CRUserChecklist), [userOrganization])
  const finished = useMemo(() => userChecklist.length === Object.values(steps).length, [steps])
  const isValidated = (step: CRUserChecklist) => userChecklist.some((checked) => checked.step === step)

  return (
    <Modal
      className={styles.modal}
      open={open}
      onClose={() => setOpen(false)}
      label="user-checklist"
      title={t('title')}
    >
      <Stepper
        className={styles.modal}
        activeStep={userChecklist.length}
        steps={Object.keys(steps).length}
        fillValidatedSteps
      />
      <div className={classNames(styles.overflowedModal, 'flex-col px-2')}>
        {Object.values(steps).map((step: CRUserChecklist) => (
          <ChecklistItem
            key={step}
            step={step}
            validated={isValidated(step)}
            onClose={() => setOpen(false)}
            organizationId={userOrganization.id}
            clients={organizations}
            studyId={studyId}
          />
        ))}
      </div>
      {finished && (
        <p className="px-2">
          {t.rich('finished', {
            faq: (children) => (
              <Link href={FAQLink} target="_blank" rel="noreferrer noopener">
                {children}
              </Link>
            ),
          })}
        </p>
      )}
    </Modal>
  )
}

export default ChecklistModal
