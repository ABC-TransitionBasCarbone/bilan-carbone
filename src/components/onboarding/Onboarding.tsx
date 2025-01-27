'use client'

import { NOT_AUTHORIZED } from '@/services/permissions/check'
import { onboardOrganizationCommand } from '@/services/serverFunctions/organization'
import { OnboardingCommand, OnboardingCommandValidation } from '@/services/serverFunctions/user.command'
import { zodResolver } from '@hookform/resolvers/zod'
import { Organization, Role } from '@prisma/client'
import { useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import OnboardingModal from './OnboardingModal'

interface Props {
  organization: Organization
}

const Onboarding = ({ organization }: Props) => {
  const [open, setOpen] = useState(false)
  const [step, setStep] = useState(0)
  const steps = 2

  const searchParams = useSearchParams()
  const onboarding = searchParams.get('onboarding')
  useEffect(() => {
    if (onboarding !== null && !organization.onboarded) {
      setOpen(true)
    }
  }, [onboarding])

  const form = useForm<OnboardingCommand>({
    resolver: zodResolver(OnboardingCommandValidation),
    mode: 'onSubmit',
    reValidateMode: 'onBlur',
    defaultValues: {
      organizationId: organization.id,
      companyName: organization.name || '',
      role: Role.ADMIN,
      collaborators: [{ email: '' }],
    },
  })

  const previousStep = () => setStep(step > 1 ? step - 1 : 0)

  const onValidate = async () => {
    if (step < steps - 1) {
      setStep(step + 1)
    } else {
      const values = form.getValues()
      values.collaborators = (values.collaborators || []).filter(
        (collaborator) => collaborator.email || collaborator.role,
      )
      const isValid = OnboardingCommandValidation.safeParse(values)
      if (isValid.success) {
        const res = await onboardOrganizationCommand(isValid.data)
        if (!res || res === NOT_AUTHORIZED) {
          onClose()
        }
      }
    }
  }

  const onClose = () => setOpen(false)

  return (
    <OnboardingModal
      open={open}
      onValidate={onValidate}
      form={form}
      onClose={onClose}
      activeStep={step}
      steps={steps}
      previousStep={previousStep}
    />
  )
}

export default Onboarding
