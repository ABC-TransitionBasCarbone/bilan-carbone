import SelectOrganization from '@/components/study/organization/select'
import { OrganizationWithSites } from '@/db/user'
import React from 'react'

const NewStudyPage = ({ organizations }: { organizations: OrganizationWithSites[] }) => {
  return (
    <>
      <SelectOrganization organizations={organizations} />
    </>
  )
}

export default NewStudyPage
