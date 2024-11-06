'use client'

import NewStudyForm from '@/components/study/new/Form'
import SelectOrganization from '@/components/study/organization/Select'
import { OrganizationWithSites } from '@/db/user'
import { User } from 'next-auth'
import { useTranslations } from 'next-intl'
import React, { useState } from 'react'
import Breadcrumbs from '../breadcrumbs/Breadcrumbs'

interface Props {
  user: User
  usersEmail: string[]
  organizations: OrganizationWithSites[]
}

const NewStudyPage = ({ organizations, user, usersEmail }: Props) => {
  const [organization, setOrganization] = useState<OrganizationWithSites>()
  const tNav = useTranslations('nav')

  return (
    <>
      <Breadcrumbs current={tNav('newStudy')} links={[{ label: tNav('home'), link: '/' }]} />
      {organization ? (
        <NewStudyForm organization={organization} user={user} usersEmail={usersEmail} />
      ) : (
        <SelectOrganization organizations={organizations} selectOrganization={setOrganization} />
      )}
    </>
  )
}

export default NewStudyPage
