'use client'

import NewStudyForm from '@/components/study/new/Form'
import SelectOrganization from '@/components/study/organization/Select'
import { OrganizationWithSites } from '@/db/user'
import { User } from 'next-auth'
import React, { useState } from 'react'

interface Props {
  user: User
  organizations: OrganizationWithSites[]
}

const NewStudyPage = ({ organizations, user }: Props) => {
  const [organization, setOrganization] = useState<OrganizationWithSites>()

  return (
    <>
      {organization ? (
        <NewStudyForm organization={organization} user={user} />
      ) : (
        <SelectOrganization organizations={organizations} selectOrganization={setOrganization} />
      )}
    </>
  )
}

export default NewStudyPage
