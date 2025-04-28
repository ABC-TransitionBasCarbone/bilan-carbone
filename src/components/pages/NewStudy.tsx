'use client'
import SelectOrganization from '@/components/study/organization/Select'
import { getOrganizationUsers } from '@/db/organization'
import { OrganizationWithSites } from '@/db/user'
import NewStudyForm from '@/environments/base/study/new/Form'
import DynamicComponent from '@/environments/core/utils/DynamicComponent'
import NewStudyFormCut from '@/environments/cut/study/new/Form'
import { CreateStudyCommand, CreateStudyCommandValidation } from '@/services/serverFunctions/study.command'
import { CUT } from '@/store/AppEnvironment'
import { CA_UNIT_VALUES, displayCA } from '@/utils/number'
import { zodResolver } from '@hookform/resolvers/zod'
import { Export, SiteCAUnit } from '@prisma/client'
import dayjs from 'dayjs'
import { User } from 'next-auth'
import { useTranslations } from 'next-intl'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import Breadcrumbs from '../breadcrumbs/Breadcrumbs'

interface Props {
  user: User
  users: Awaited<ReturnType<typeof getOrganizationUsers>>
  organizations: OrganizationWithSites[]
  defaultOrganization?: OrganizationWithSites
  caUnit: SiteCAUnit
}

const NewStudyPage = ({ organizations, user, users, defaultOrganization, caUnit }: Props) => {
  const [organization, setOrganization] = useState<OrganizationWithSites>()
  const tNav = useTranslations('nav')

  const form = useForm<CreateStudyCommand>({
    resolver: zodResolver(CreateStudyCommandValidation),
    mode: 'onBlur',
    reValidateMode: 'onChange',
    defaultValues: {
      name: '',
      validator: user.email,
      isPublic: 'true',
      startDate: dayjs().toISOString(),
      realizationStartDate: dayjs().toISOString(),
      organizationId: (defaultOrganization ?? organizations[0])?.id || '',
      sites:
        (defaultOrganization ?? organizations[0])?.sites.map((site) => ({
          ...site,
          ca: site.ca ? displayCA(site.ca, CA_UNIT_VALUES[caUnit]) : 0,
          selected: false,
          postalCode: site.postalCode ?? '',
          city: site.city ?? '',
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
      <Breadcrumbs
        current={tNav('newStudy')}
        links={[
          { label: tNav('home'), link: '/' },
          defaultOrganization && defaultOrganization.isCR
            ? { label: defaultOrganization.name, link: `/organisations/${defaultOrganization.id}` }
            : undefined,
        ].filter((link) => link !== undefined)}
      />
      {organization ? (
        <DynamicComponent
          environmentComponents={{ [CUT]: <NewStudyFormCut user={user} users={users} form={form} /> }}
          defaultComponent={<NewStudyForm user={user} users={users} form={form} />}
        />
      ) : (
        <SelectOrganization
          organizations={organizations}
          selectOrganization={setOrganization}
          form={form}
          caUnit={caUnit}
        />
      )}
    </>
  )
}

export default NewStudyPage
