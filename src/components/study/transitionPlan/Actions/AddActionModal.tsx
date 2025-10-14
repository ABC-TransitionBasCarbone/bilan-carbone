import Button from '@/components/base/Button'
import Form from '@/components/base/Form'
import LoadingButton from '@/components/base/LoadingButton'
import Stepper from '@/components/base/Stepper'
import Modal from '@/components/modals/Modal'
import { AddActionCommand, AddActionCommandValidation } from '@/services/serverFunctions/study.command'
import { zodResolver } from '@hookform/resolvers/zod'
import classNames from 'classnames'
import { useTranslations } from 'next-intl'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import styles from './Actions.module.css'
import Step1 from './AddActionStep1'
import Step2 from './AddActionStep2'
import Step3 from './AddActionStep3'

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
  const t = useTranslations('study.transitionPlan.actions.addModal')

  const { control, formState, getValues, setValue, handleSubmit } = useForm<AddActionCommand>({
    resolver: zodResolver(AddActionCommandValidation),
    mode: 'onSubmit',
    reValidateMode: 'onChange',
    defaultValues: { studyId, actionPorter: '', nature: [], category: [], relevance: [] },
  })

  const onSubmit = () => {
    console.log('onSubmit : ', getValues())
  }

  return (
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
            {step === 1 && <Step1 studyUnit={studyUnit} control={control} setValue={setValue} getValues={getValues} />}
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
  )
}

export default AddActionModal
