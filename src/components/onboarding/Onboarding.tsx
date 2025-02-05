'use client'

import { setOnboardedOrganization } from '@/services/serverFunctions/organization'
import { Organization } from '@prisma/client'
import { SessionProvider } from 'next-auth/react'
import { useEffect, useState } from 'react'
import OnboardingModal from './OnboardingModal'

interface Props {
  organization: Organization
}

const Onboarding = ({ organization }: Props) => {
  const [open, setOpen] = useState(true)

  useEffect(() => {
    setOnboardedOrganization(organization.id)
  }, [])

  const onClose = () => setOpen(false)

  return (
    <SessionProvider>
      <OnboardingModal open={open} onClose={onClose} organization={organization} />
    </SessionProvider>
  )
}

export default Onboarding
