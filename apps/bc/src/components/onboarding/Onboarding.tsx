'use client'

import { OrganizationVersionWithOrganization } from '@/db/organization'
import { setOnboardedOrganizationVersion } from '@/services/serverFunctions/organization'
import { UserSession } from 'next-auth'
import { SessionProvider } from 'next-auth/react'
import { useEffect, useState } from 'react'
import OnboardingModal from './OnboardingModal'

interface Props {
  user: UserSession
  organizationVersion: OrganizationVersionWithOrganization
}

const Onboarding = ({ organizationVersion, user }: Props) => {
  const [open, setOpen] = useState(true)

  useEffect(() => {
    if (!open) {
      setOnboardedOrganizationVersion(organizationVersion.id)
    }
  }, [open])

  const onClose = () => setOpen(false)

  return (
    <SessionProvider>
      <OnboardingModal open={open} onClose={onClose} user={user} organizationVersion={organizationVersion} />
    </SessionProvider>
  )
}

export default Onboarding
