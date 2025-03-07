import { CRUserChecklist, UserCheckedStep } from '@prisma/client'
import { useTranslations } from 'next-intl'
import Stepper from '../base/Stepper'
import Modal from '../modals/Modal'
import styles from './Checklist.module.css'
import ChecklistItem from './ChecklistItem'

interface Props {
  open: boolean
  setOpen: (open: boolean) => void
  steps: typeof CRUserChecklist
  userChecklist: UserCheckedStep[]
}

const ChecklistModal = ({ open, setOpen, steps, userChecklist }: Props) => {
  const t = useTranslations('checklist')
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
      <div className="flex-col">
        {Object.values(steps).map((step: CRUserChecklist) => (
          <ChecklistItem key={step} step={step} validated={isValidated(step)} />
        ))}
      </div>
    </Modal>
  )
}

export default ChecklistModal
