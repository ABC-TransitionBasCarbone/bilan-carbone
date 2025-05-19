// TO DELETE ts-nockeck
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import { onboardOrganizationCommand } from '@/services/serverFunctions/organization'
import { changeUserRoleOnOnboarding } from '@/services/serverFunctions/user'
import { OnboardingCommand, OnboardingCommandValidation } from '@/services/serverFunctions/user.command'
import { zodResolver } from '@hookform/resolvers/zod'
import CloseIcon from '@mui/icons-material/Close'
import { Dialog, DialogActions, DialogContent, DialogTitle, Button as MUIButton } from '@mui/material'
import { Organization, Role } from '@prisma/client'
import classNames from 'classnames'
import { User } from 'next-auth'
import { useSession } from 'next-auth/react'
import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import Button from '../base/Button'
import Form from '../base/Form'
import LoadingButton from '../base/LoadingButton'
import Stepper from '../base/Stepper'
import styles from './Onboarding.module.css'
import Step1 from './OnboardingStep1'
import Step2 from './OnboardingStep2'

interface Props {
  open: boolean
  onClose: () => void
  user: User
  organization: Organization
}

const OnboardingModal = ({ open, onClose, user, organization }: Props) => {
  const t = useTranslations('onboarding')
  const { update: updateSession } = useSession()
  const router = useRouter()

  const [activeStep, setActiveStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const stepCount = 2
  const Step = activeStep === 1 ? Step1 : Step2

  const newRole = useMemo(() => (user.level ? Role.ADMIN : Role.GESTIONNAIRE), [user])

  useEffect(() => {
    changeUserRoleOnOnboarding()
  }, [])

  const form = useForm<OnboardingCommand>({
    resolver: zodResolver(OnboardingCommandValidation),
    mode: 'onSubmit',
    reValidateMode: 'onChange',
    defaultValues: {
      organizationId: organization.id,
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      companyName: organization.name || '',
      collaborators: [{ email: '' }],
    },
  })

  const goToPreviousStep = () => setActiveStep(activeStep > 1 ? activeStep - 1 : 1)
  const goToNextStep = () => setActiveStep(activeStep + 1)

  const onCloseModal = async () => {
    await updateSession()
    onClose()
    router.refresh()
  }

  const onValidate = async () => {
    setLoading(true)
    const values = form.getValues()
    values.collaborators = (values.collaborators || []).filter(
      (collaborator) => collaborator.email || collaborator.role,
    )
    await onboardOrganizationCommand(values)
    setLoading(false)
    onCloseModal()
  }

  return (
    <Dialog
      open={open}
      data-testid="onboarding-modal"
      aria-labelledby="onboarding-modale-title"
      aria-describedby="onboarding-modale-description"
      classes={{ paper: styles.dialog }}
    >
      <div className={styles.container}>
        <Form onSubmit={form.handleSubmit(onValidate)}>
          <div className="justify-end">
            <MUIButton className={styles.closeIcon} onClick={onCloseModal}>
              <CloseIcon />
            </MUIButton>
          </div>
          <DialogTitle className="noSpacing">
            <>
              <Stepper activeStep={activeStep} steps={stepCount} fillValidatedSteps />
              <p className={classNames(styles.stepTitle, 'mb2')}>{t(`title-${activeStep}`)}</p>
              <p>{t(`titleDescription-${activeStep}`)}</p>
            </>
          </DialogTitle>
          <DialogContent className="noSpacing">
            <Step form={form} role={newRole} isCr={organization.isCR} />
          </DialogContent>
          <DialogActions className="noSpacing">
            {activeStep > 1 && <Button onClick={goToPreviousStep}>{t('previous')}</Button>}
            {activeStep === stepCount ? (
              <LoadingButton type="submit" loading={loading}>
                {t('validate')}
              </LoadingButton>
            ) : (
              <Button type="button" onClick={goToNextStep}>
                {t('next')}
              </Button>
            )}
          </DialogActions>
        </Form>
      </div>
    </Dialog>
  )
}

export default OnboardingModal
