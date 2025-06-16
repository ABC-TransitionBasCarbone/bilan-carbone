'use client'
import SelectOrganization from '@/components/study/organization/Select'
import { OrganizationWithSites } from '@/db/account'
import { getOrganizationVersionAccounts } from '@/db/organization'
import NewStudyForm from '@/environments/base/study/new/Form'
import DynamicComponent from '@/environments/core/utils/DynamicComponent'
import NewStudyFormCut from '@/environments/cut/study/new/Form'
import { useDuplicateStudy } from '@/hooks/useDuplicateStudy'
import { CreateStudyCommand, CreateStudyCommandValidation } from '@/services/serverFunctions/study.command'
import { CA_UNIT_VALUES, displayCA } from '@/utils/number'
import { zodResolver } from '@hookform/resolvers/zod'
import CircularProgress from '@mui/material/CircularProgress'
import Typography from '@mui/material/Typography'
import { Environment, Export, SiteCAUnit } from '@prisma/client'
import dayjs from 'dayjs'
import { UserSession } from 'next-auth'
import { useTranslations } from 'next-intl'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import Breadcrumbs from '../breadcrumbs/Breadcrumbs'
import styles from './NewStudy.module.css'

interface Props {
  user: UserSession
  accounts: Awaited<ReturnType<typeof getOrganizationVersionAccounts>>
  organizationVersions: OrganizationWithSites[]
  defaultOrganizationVersion?: OrganizationWithSites
  caUnit: SiteCAUnit
  duplicateStudyId: string | null
}

const NewStudyPage = ({
  organizationVersions,
  user,
  accounts,
  defaultOrganizationVersion,
  caUnit,
  duplicateStudyId,
}: Props) => {
  const [organizationVersion, setOrganizationVersion] = useState<OrganizationWithSites>()
  const tNav = useTranslations('nav')
  const tStudy = useTranslations('study')
  const tSpinner = useTranslations('spinner')

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
      organizationVersionId: (defaultOrganizationVersion ?? organizationVersions[0])?.id || '',
      sites:
        (defaultOrganizationVersion ?? organizationVersions[0])?.organization.sites.map((site) => ({
          ...site,
          ca: site.ca ? displayCA(site.ca, CA_UNIT_VALUES[caUnit]) : 0,
          selected: false,
          postalCode: site.postalCode ?? '',
          city: site.city ?? '',
          cncId: site.cncId ?? '',
        })) || [],
      exports: {
        [Export.Beges]: false,
        [Export.GHGP]: false,
        [Export.ISO14069]: false,
      },
    },
  })

  const { targetOrganizationVersionId, isLoading } = useDuplicateStudy({ duplicateStudyId, form, user, caUnit })

  if (isLoading) {
    return (
      <div className={`${styles.loadingContainer} flex-cc flex-col p10`}>
        <CircularProgress className={styles.spinner} />
        <Typography>{tSpinner('loading')}</Typography>
      </div>
    )
  }

  return (
    <>
      <Breadcrumbs
        current={duplicateStudyId ? tStudy('duplicate') : tNav('newStudy')}
        links={[
          { label: tNav('home'), link: '/' },
          defaultOrganizationVersion && defaultOrganizationVersion.isCR
            ? {
                label: defaultOrganizationVersion.organization.name,
                link: `/organisations/${defaultOrganizationVersion.id}`,
              }
            : undefined,
        ].filter((link) => link !== undefined)}
      />
      {organizationVersion ? (
        <DynamicComponent
          environmentComponents={{
            [Environment.CUT]: <NewStudyFormCut form={form} duplicateStudyId={duplicateStudyId} />,
          }}
          defaultComponent={
            <NewStudyForm user={user} accounts={accounts} form={form} duplicateStudyId={duplicateStudyId} />
          }
        />
      ) : (
        <SelectOrganization
          user={user}
          organizationVersions={organizationVersions}
          selectOrganizationVersion={setOrganizationVersion}
          form={form}
          caUnit={caUnit}
          duplicateStudyId={duplicateStudyId}
          targetOrganizationVersionId={targetOrganizationVersionId}
        />
      )}
    </>
  )
}

export default NewStudyPage
