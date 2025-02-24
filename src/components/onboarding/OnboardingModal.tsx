import { onboardOrganizationCommand } from '@/services/serverFunctions/organization'
import { OnboardingCommand, OnboardingCommandValidation } from '@/services/serverFunctions/user.command'
import { zodResolver } from '@hookform/resolvers/zod'
import CloseIcon from '@mui/icons-material/Close'
import { Dialog, DialogActions, DialogContent, DialogTitle, MobileStepper, Button as MUIButton } from '@mui/material'
import { Organization, Role } from '@prisma/client'
import classNames from 'classnames'
import { User } from 'next-auth'
import { useSession } from 'next-auth/react'
import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import Button from '../base/Button'
import Form from '../base/Form'
import LoadingButton from '../base/LoadingButton'
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

  const [activeStep, setActiveStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const stepCount = 2
  const Step = activeStep === 0 ? Step1 : Step2
  const buttonLabel = activeStep === stepCount - 1 ? 'validate' : 'next'

  const newRole = useMemo(() => (user.level ? Role.ADMIN : Role.GESTIONNAIRE), [user])

  const form = useForm<OnboardingCommand>({
    resolver: zodResolver(OnboardingCommandValidation),
    mode: 'onSubmit',
    reValidateMode: 'onBlur',
    defaultValues: {
      organizationId: organization.id,
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      companyName: organization.name || '',
      collaborators: [{ email: '' }],
    },
  })

  const goToPreviousStep = () => setActiveStep(activeStep > 1 ? activeStep - 1 : 0)

  const onValidate = async () => {
    if (activeStep < stepCount - 1) {
      setActiveStep(activeStep + 1)
    } else {
      setLoading(true)
      const values = form.getValues()
      values.collaborators = (values.collaborators || []).filter(
        (collaborator) => collaborator.email || collaborator.role,
      )
      const isValid = OnboardingCommandValidation.safeParse(values)
      if (isValid.success) {
        const result = await onboardOrganizationCommand(isValid.data)
        if (result) {
          onClose()
        } else {
          await updateSession()
          onClose()
          router.refresh()
        }
      }
      setLoading(false)
    }
  }

  const Title = (
    <>
      <MobileStepper
        className="mb2"
        classes={{ dot: styles.stepperDots, dotActive: styles.active }}
        style={{ padding: 0 }}
        variant="dots"
        steps={stepCount}
        position="static"
        activeStep={activeStep}
        sx={{ flexGrow: 1 }}
        nextButton={null}
        backButton={null}
      />
      <p className={classNames(styles.stepTitle, 'mb2')}>{t(`title-${activeStep}`)}</p>
      <p>{t(`titleDescription-${activeStep}`)}</p>
    </>
  )

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
            <MUIButton className={styles.closeIcon} onClick={onClose}>
              <CloseIcon />
            </MUIButton>
          </div>
          <DialogTitle className="noSpacing">{Title}</DialogTitle>
          <DialogContent className="noSpacing">
            <Step form={form} role={newRole} isCr={organization.isCR} />
          </DialogContent>
          <DialogActions className="noSpacing">
            {activeStep > 0 && <Button onClick={goToPreviousStep}>{t('previous')}</Button>}
            <LoadingButton type="submit" loading={loading}>
              {t(buttonLabel)}
            </LoadingButton>
          </DialogActions>
        </Form>
      </div>
    </Dialog>
  )
}

export default OnboardingModal
