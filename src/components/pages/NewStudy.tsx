'use client'

import NewStudyForm from '@/components/study/new/Form'
import SelectOrganization from '@/components/study/organization/Select'
import { OrganizationWithSites } from '@/db/user'
import { User } from 'next-auth'
import React, { useState } from 'react'

interface Props {
  user: User
  usersEmail: string[]
  organizations: OrganizationWithSites[]
}

const NewStudyPage = ({ organizations, user, usersEmail }: Props) => {
  const [organization, setOrganization] = useState<OrganizationWithSites>()

  return (
    <>
      {organization ? (
        <NewStudyForm organization={organization} user={user} usersEmail={usersEmail} />
      ) : (
        <SelectOrganization organizations={organizations} selectOrganization={setOrganization} />
      )}
    </>
  )
}

export default NewStudyPage
