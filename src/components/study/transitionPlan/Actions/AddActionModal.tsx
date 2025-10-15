import Button from '@/components/base/Button'
import Form from '@/components/base/Form'
import LoadingButton from '@/components/base/LoadingButton'
import Stepper from '@/components/base/Stepper'
import Toast, { ToastColors } from '@/components/base/Toast'
import Modal from '@/components/modals/Modal'
import { AddActionCommand, AddActionCommandValidation } from '@/services/serverFunctions/study.command'
import { addAction } from '@/services/serverFunctions/transitionPlan'
import { zodResolver } from '@hookform/resolvers/zod'
import classNames from 'classnames'
import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import styles from './Actions.module.css'
import Step1 from './AddActionStep1'
import Step2 from './AddActionStep2'
import Step3 from './AddActionStep3'

const emptyToast = { text: '', color: 'info' } as const
const toastPosition = { vertical: 'bottom', horizontal: 'left' } as const

interface Props {
  open: boolean
  onClose: () => void
  studyId: string
  studyUnit: string
  porters: { label: string; value: string }[]
}
const steps = 3

const AddActionModal = ({ open, onClose, studyId, studyUnit, porters }: Props) => {
  const [step, setStep] = useState(1)
  const [toast, setToast] = useState<{ text: string; color: ToastColors }>(emptyToast)
  const t = useTranslations('study.transitionPlan.actions.addModal')

  const router = useRouter()

  const { control, formState, getValues, setValue, reset, handleSubmit } = useForm<AddActionCommand>({
    resolver: zodResolver(AddActionCommandValidation),
    mode: 'onSubmit',
    reValidateMode: 'onChange',
    defaultValues: {
      studyId,
      potentialDeduction: undefined,
      actionPorter: '',
      nature: [],
      category: [],
      relevance: [],
    },
  })

  const onSubmit = async () => {
    const res = await addAction(getValues())
    if (res.success) {
      onClose()
      reset()
      setStep(1)
      router.refresh()
    } else {
      onClose()
      setToast({ text: t(res.errorMessage), color: 'error' })
    }
  }

  return (
    <>
      <Modal open={open} label="add-action-modal" onClose={onClose}>
        <Stepper
          className={classNames(styles.drawer, styles.centered)}
          activeStep={step}
          steps={steps}
          fillValidatedSteps
          small
        />
        <div className={classNames(styles.modal, 'px-2')}>
          <h6>{t('add')}</h6>
          <p>{t(step === 1 ? 'subTitle' : 'optionalSubtitle')}</p>
          <div className="mt1">
            <Form onSubmit={handleSubmit(onSubmit)} className={classNames(styles.form, 'grow justify-center')}>
              {step === 1 && (
                <Step1 studyUnit={studyUnit} control={control} setValue={setValue} getValues={getValues} />
              )}
              {step === 2 && <Step2 control={control} />}
              {step === 3 && <Step3 porters={porters} control={control} setValue={setValue} />}
              <div className="justify-between my1">
                <Button disabled={step <= 1} onClick={() => setStep((prev) => prev - 1)}>
                  {t('previous')}
                </Button>
                {step < steps ? (
                  <Button onClick={() => setStep((prev) => prev + 1)}>{t('next')}</Button>
                ) : (
                  <LoadingButton type="submit" loading={formState.isValidating}>
                    {t('add')}
                  </LoadingButton>
                )}
              </div>
            </Form>
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

export default AddActionModal
