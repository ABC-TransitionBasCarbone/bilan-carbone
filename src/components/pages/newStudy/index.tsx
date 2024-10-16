'use client'

import NewStudyForm from '@/components/study/new'
import SelectOrganization from '@/components/study/organization/select'
import { OrganizationWithSites } from '@/db/user'
import React, { useState } from 'react'

interface Props {
  organizations: OrganizationWithSites[]
}

const NewStudyPage = ({ organizations }: Props) => {
  const [organization, setOrganization] = useState<OrganizationWithSites>()
  return (
    <>
      {organization ? (
        <NewStudyForm />
      ) : (
        <SelectOrganization organizations={organizations} selectOrganization={setOrganization} />
      )}
    </>
  )
}

export default NewStudyPage
