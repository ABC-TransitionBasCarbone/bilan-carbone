import SelectOrganization from '@/components/study/organization/select'
import { OrganizationWithSites } from '@/db/user'
import React from 'react'

interface Props {
  organizations: OrganizationWithSites[]
}

const NewStudyPage = ({ organizations }: Props) => {
  return (
    <>
      <SelectOrganization organizations={organizations} />
    </>
  )
}

export default NewStudyPage
