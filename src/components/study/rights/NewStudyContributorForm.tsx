'use client'

import Form from '@/components/base/Form'
import LoadingButton from '@/components/base/LoadingButton'
import MultiplePosts from '@/components/emissionFactor/Form/MultiplePosts'
import { FormTextField } from '@/components/form/TextField'
import { getOrganizationVersionAccounts } from '@/db/organization'
import { FullStudy } from '@/db/study'
import { useServerFunction } from '@/hooks/useServerFunction'
import { newStudyContributor } from '@/services/serverFunctions/study'
import {
  NewStudyContributorCommand,
  NewStudyContributorCommandValidation,
} from '@/services/serverFunctions/study.command'
import { zodResolver } from '@hookform/resolvers/zod'
import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import NewStudyRightModal from './NewStudyRightModal'

interface Props {
  study: FullStudy
  accounts: Awaited<ReturnType<typeof getOrganizationVersionAccounts>>
}

const NewStudyContributorForm = ({ study, accounts }: Props) => {
  const router = useRouter()
  const t = useTranslations('study.rights.newContributor')

  const { callServerFunction } = useServerFunction()
  const [otherOrganizationVersion, setOtherOrganizationVersion] = useState(false)
  const [loading, setLoading] = useState(false)

  const form = useForm<NewStudyContributorCommand>({
    resolver: zodResolver(NewStudyContributorCommandValidation),
    mode: 'onBlur',
    reValidateMode: 'onChange',
    defaultValues: {
      studyId: study.id,
      email: '',
    },
  })

  const onSubmit = async (command: NewStudyContributorCommand) => {
    if (otherOrganizationVersion || accounts.some((account) => account.user.email === form.getValues('email'))) {
      setLoading(true)
      await callServerFunction(() => newStudyContributor(command), {
        getErrorMessage: (error) => t(error),
        onSuccess: () => {
          setLoading(false)
          router.push(`/etudes/${study.id}/cadrage`)
        },
        onError: () => {
          setLoading(false)
        },
      })
    } else {
      setOtherOrganizationVersion(true)
    }
  }

  return (
    <Form onSubmit={form.handleSubmit(onSubmit)}>
      <FormTextField
        data-testid="study-contributor-email"
        control={form.control}
        name="email"
        label={t('email')}
        trim
      />
      <MultiplePosts form={form} context="studyContributor" />
      <LoadingButton type="submit" loading={form.formState.isSubmitting} data-testid="study-contributor-create-button">
        {t('create')}
      </LoadingButton>
      <NewStudyRightModal
        otherOrganizationVersion={otherOrganizationVersion}
        decline={() => setOtherOrganizationVersion(false)}
        accept={form.handleSubmit(onSubmit)}
        loading={loading}
      />
    </Form>
  )
}

export default NewStudyContributorForm
