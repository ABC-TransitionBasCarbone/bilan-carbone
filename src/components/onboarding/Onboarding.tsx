'use client'

import { OrganizationVersionWithOrganization } from '@/db/organization'
import { setOnboardedOrganizationVersion } from '@/services/serverFunctions/organization'
import { UserSession } from 'next-auth'
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

  return <OnboardingModal open={open} onClose={onClose} user={user} organizationVersion={organizationVersion} />
}

export default Onboarding
