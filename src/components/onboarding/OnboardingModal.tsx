import { OnboardingCommand } from '@/services/serverFunctions/user.command'
import CloseIcon from '@mui/icons-material/Close'
import { Dialog, DialogActions, DialogContent, DialogTitle, Button as MUIButton } from '@mui/material'
import MobileStepper from '@mui/material/MobileStepper'
import classNames from 'classnames'
import { useTranslations } from 'next-intl'
import { UseFormReturn } from 'react-hook-form'
import Button from '../base/Button'
import Form from '../base/Form'
import styles from './Onboarding.module.css'
import Step1 from './OnboardingStep1'
import Step2 from './OnboardingStep2'

interface Props {
  open: boolean
  activeStep: number
  steps: number
  previousStep: () => void
  form: UseFormReturn<OnboardingCommand>
  onClose: () => void
  onValidate: () => void
}

const OnboardingModal = ({ open, activeStep, form, steps, previousStep, onClose, onValidate }: Props) => {
  const t = useTranslations('onboarding')
  const Step = activeStep === 0 ? Step1 : Step2
  const buttonLabel = activeStep === steps - 1 ? 'validate' : 'next'
  return (
    <Dialog open={open} aria-labelledby="onboarding-dialog-title" aria-describedby="onboarding-dialog-description">
      <div className={styles.modal}>
        <Form onSubmit={form.handleSubmit(onValidate)}>
          <div className="justify-end">
            <MUIButton className={styles.closeIcon} onClick={onClose}>
              <CloseIcon />
            </MUIButton>
          </div>
          <DialogTitle className={styles.noSpacing}>
            <>
              <MobileStepper
                className="mb2"
                classes={{ dot: styles.dot, dotActive: styles.active }}
                style={{ padding: 0 }}
                variant="dots"
                steps={steps}
                position="static"
                activeStep={activeStep}
                sx={{ maxWidth: 400, flexGrow: 1 }}
                nextButton={<></>}
                backButton={<></>}
              />
              <p className={classNames(styles.stepTitle, 'mb2')}>{t(`title-${activeStep}`)}</p>
              <p>{t(`titleDescription-${activeStep}`)}</p>
            </>
          </DialogTitle>
          <DialogContent className={styles.noSpacing}>
            <Step form={form} />
          </DialogContent>
          <DialogActions className={styles.noSpacing}>
            {activeStep > 0 && <Button onClick={previousStep}>{t('previous')}</Button>}
            <Button type="submit">{t(buttonLabel)}</Button>
          </DialogActions>
        </Form>
      </div>
    </Dialog>
  )
}

export default OnboardingModal
