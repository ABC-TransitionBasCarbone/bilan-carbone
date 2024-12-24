'use client'

import Button from '@/components/base/Button'
import Form from '@/components/base/Form'
import { FullStudy } from '@/db/study'
import { OrganizationWithSites } from '@/db/user'
import { changeStudySites } from '@/services/serverFunctions/study'
import { ChangeStudySitesCommand, ChangeStudySitesCommandValidation } from '@/services/serverFunctions/study.command'
import { zodResolver } from '@hookform/resolvers/zod'
import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import Sites from '../organization/Sites'

interface Props {
  study: FullStudy
  organization: OrganizationWithSites
}

const EditStudySitesForm = ({ study, organization }: Props) => {
  const t = useTranslations('study.perimeter')
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const siteList =
    organization.sites
      .map((site) => {
        const studySite = study.sites.find((ss) => ss.site.id === site.id)
        return studySite
          ? { ...studySite, id: site.id, name: studySite.site.name, selected: true }
          : { ...site, selected: false }
      })
      .sort((a, b) => (b.selected ? 1 : 0) - (a.selected ? 1 : 0)) || []

  const form = useForm<ChangeStudySitesCommand>({
    resolver: zodResolver(ChangeStudySitesCommandValidation),
    mode: 'onBlur',
    reValidateMode: 'onChange',
    defaultValues: {
      organizationId: organization.id,
      sites: siteList,
    },
  })

  const onSubmit = async (command: ChangeStudySitesCommand) => {
    const result = await changeStudySites(study.id, command)
    if (result) {
      setError(result)
    } else {
      router.push(`/etudes/${study.id}/perimetre`)
      router.refresh()
    }
  }

  const sites = form.watch('sites')
  const disabledUpdateButton = sites.every((site) => !site.selected)

  return (
    <Form onSubmit={form.handleSubmit(onSubmit)}>
      <Sites sites={sites} form={form} />
      <Button
        type="submit"
        disabled={form.formState.isSubmitting || disabledUpdateButton}
        data-testid="edit-study-sites-button"
      >
        {t('save')}
      </Button>
      {error && <p>{error}</p>}
    </Form>
  )
}

export default EditStudySitesForm
