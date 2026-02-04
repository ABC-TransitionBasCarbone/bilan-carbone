'use client'
import SelectOrganization from '@/components/study/organization/Select'
import { OrganizationWithSites } from '@/db/account'
import { getOrganizationVersionAccounts } from '@/db/organization'
import NewStudyForm from '@/environments/base/study/new/Form'
import NewStudyFormClickson from '@/environments/clickson/study/new/Form'
import DynamicComponent from '@/environments/core/utils/DynamicComponent'
import { typeDynamicComponent } from '@/environments/core/utils/dynamicUtils'
import NewStudyFormCut from '@/environments/cut/study/new/Form'
import NewStudyFormTilt from '@/environments/tilt/study/new/Form'
import { useDuplicateStudy } from '@/hooks/useDuplicateStudy'
import { hasAccessToDuplicateStudy } from '@/services/permissions/environment'
import { CreateStudyCommand, CreateStudyCommandValidation } from '@/services/serverFunctions/study.command'
import { CA_UNIT_VALUES, displayCA } from '@/utils/number'
import { zodResolver } from '@hookform/resolvers/zod'
import CircularProgress from '@mui/material/CircularProgress'
import Typography from '@mui/material/Typography'
import { Environment, SiteCAUnit } from '@prisma/client'
import dayjs from 'dayjs'
import { UserSession } from 'next-auth'
import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
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
  const [simplified, setSimplified] = useState<boolean>(false)
  const router = useRouter()
  const tNav = useTranslations('nav')
  const tStudy = useTranslations('study')
  const tSpinner = useTranslations('spinner')

  useEffect(() => {
    if (!hasAccessToDuplicateStudy(user.environment)) {
      const url = new URL(window.location.href)
      if (url.searchParams.has('duplicate')) {
        url.searchParams.delete('duplicate')
        router.replace(url.pathname + (url.search ? `?${url.searchParams}` : ''))
      }
    }
  }, [user.environment, router])

  useEffect(() => {
    const url = new URL(window.location.href)
    const simplifiedParam = url.searchParams.get('simplified')
    setSimplified(simplifiedParam === 'true')
  }, [router])

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
          cncCode: site.cnc?.cncCode || '',
          establishmentYear: site?.establishmentYear ? parseInt(site?.establishmentYear) : 0,
          establishmentType: site.establishmentType ?? undefined,
          academy: site.establishmentType ?? undefined,
        })) || [],
      exports: [],
    },
  })

  // DO NOT REMOVE. Necessary to keep form up to date after controlMode change
  form.watch('controlMode')

  const { isLoading, sourceStudy } = useDuplicateStudy({ duplicateStudyId, form, user, caUnit })

  if (isLoading) {
    return (
      <div className="flex-cc flex-col my2 gapped1">
        <CircularProgress className={styles.spinner} color="primary" />
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
          defaultOrganizationVersion
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
            [Environment.CUT]: typeDynamicComponent({ component: NewStudyFormCut, props: { form } }),
            [Environment.CLICKSON]: typeDynamicComponent({ component: NewStudyFormClickson, props: { form } }),
            [Environment.TILT]: typeDynamicComponent({
              component: NewStudyFormTilt,
              props: { user, accounts, form, duplicateStudyId, sourceStudy, simplified },
            }),
          }}
          defaultComponent={typeDynamicComponent({
            component: NewStudyForm,
            props: { user, accounts, form, duplicateStudyId, sourceStudy },
          })}
          environment={user.environment}
        />
      ) : (
        <SelectOrganization
          user={user}
          organizationVersions={organizationVersions}
          selectOrganizationVersion={setOrganizationVersion}
          form={form}
          caUnit={caUnit}
          duplicateStudyId={duplicateStudyId}
        />
      )}
    </>
  )
}

export default NewStudyPage
