'use client'

import Form from '@/components/base/Form'
import LoadingButton from '@/components/base/LoadingButton'
import MultiplePosts from '@/components/emissionFactor/Form/MultiplePosts'
import { FormTextField } from '@/components/form/TextField'
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
import { useForm } from 'react-hook-form'

interface Props {
  study: FullStudy
}

const NewStudyContributorForm = ({ study }: Props) => {
  const router = useRouter()
  const t = useTranslations('study.rights.newContributor')
  const { callServerFunction } = useServerFunction()

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
    await callServerFunction(() => newStudyContributor(command), {
      translationFn: t,
      onSuccess: () => {
        router.push(`/etudes/${study.id}/cadrage`)
      },
    })
  }

  return (
    <Form onSubmit={form.handleSubmit(onSubmit)}>
      <FormTextField
        data-testid="study-contributor-email"
        control={form.control}
        translation={t}
        name="email"
        label={t('email')}
      />
      <MultiplePosts form={form} context="studyContributor" />
      <LoadingButton type="submit" loading={form.formState.isSubmitting} data-testid="study-contributor-create-button">
        {t('create')}
      </LoadingButton>
    </Form>
  )
}

export default NewStudyContributorForm
