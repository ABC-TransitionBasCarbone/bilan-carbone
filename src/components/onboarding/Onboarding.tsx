'use client'

import { Organization } from '@prisma/client'
import { SessionProvider } from 'next-auth/react'
import { useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import OnboardingModal from './OnboardingModal'

interface Props {
  organization: Organization
}

const Onboarding = ({ organization }: Props) => {
  const [open, setOpen] = useState(false)

  const searchParams = useSearchParams()
  const onboarding = searchParams.get('onboarding')
  useEffect(() => {
    if (onboarding !== null && !organization.onboarded) {
      setOpen(true)
    }
  }, [onboarding])

  const onClose = () => setOpen(false)

  return (
    <SessionProvider>
      <OnboardingModal open={open} onClose={onClose} organization={organization} />
    </SessionProvider>
  )
}

export default Onboarding
