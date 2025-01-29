'use client'
import NewStudyForm from '@/components/study/new/Form'
import SelectOrganization from '@/components/study/organization/Select'
import { OrganizationWithSites } from '@/db/user'
import { CreateStudyCommand, CreateStudyCommandValidation } from '@/services/serverFunctions/study.command'
import { displayCA } from '@/utils/number'
import { zodResolver } from '@hookform/resolvers/zod'
import { Export } from '@prisma/client'
import dayjs from 'dayjs'
import { User } from 'next-auth'
import { useTranslations } from 'next-intl'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import Breadcrumbs from '../breadcrumbs/Breadcrumbs'

interface Props {
  user: User
  usersEmail: string[]
  organizations: OrganizationWithSites[]
  defaultOrganization?: OrganizationWithSites
}

const NewStudyPage = ({ organizations, user, usersEmail, defaultOrganization }: Props) => {
  const [organization, setOrganization] = useState<OrganizationWithSites>()
  const tNav = useTranslations('nav')

  const form = useForm<CreateStudyCommand>({
    resolver: zodResolver(CreateStudyCommandValidation),
    mode: 'onBlur',
    reValidateMode: 'onChange',
    defaultValues: {
      name: '',
      validator: '',
      isPublic: 'true',
      startDate: dayjs().toISOString(),
      organizationId: (defaultOrganization ?? organizations[0])?.id || '',
      sites:
        (defaultOrganization ?? organizations[0])?.sites.map((site) => ({
          ...site,
          ca: site.ca ? displayCA(site.ca, 1000) : 0,
          selected: false,
        })) || [],
      exports: {
        [Export.Beges]: false,
        [Export.GHGP]: false,
        [Export.ISO14069]: false,
      },
    },
  })

  return (
    <>
      <Breadcrumbs current={tNav('newStudy')} links={[{ label: tNav('home'), link: '/' }]} />
      {organization ? (
        <NewStudyForm user={user} usersEmail={usersEmail} form={form} />
      ) : (
        <SelectOrganization organizations={organizations} selectOrganization={setOrganization} form={form} />
      )}
    </>
  )
}

export default NewStudyPage
