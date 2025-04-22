'use client'

import Form from '@/components/base/Form'
import LoadingButton from '@/components/base/LoadingButton'
import MultiplePosts from '@/components/emissionFactor/Form/MultiplePosts'
import { FormTextField } from '@/components/form/TextField'
import { FullStudy } from '@/db/study'
import { newStudyContributor } from '@/services/serverFunctions/study'
import {
  NewStudyContributorCommand,
  NewStudyContributorCommandValidation,
} from '@/services/serverFunctions/study.command'
import { zodResolver } from '@hookform/resolvers/zod'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { useForm } from 'react-hook-form'

interface Props {
  study: FullStudy
}

const faq = process.env.NEXT_PUBLIC_ABC_FAQ_LINK || ''
const contactMail = process.env.NEXT_PUBLIC_ABC_SUPPORT_MAIL

const NewStudyContributorForm = ({ study }: Props) => {
  const router = useRouter()
  const t = useTranslations('study.rights.newContributor')

  const [error, setError] = useState('')

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
    const result = await newStudyContributor(command)
    if (result) {
      setError(result)
    } else {
      router.push(`/etudes/${study.id}/cadrage`)
      router.refresh()
    }
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
      {error && (
        <p>
          {t.rich(error, {
            support: (children) => <Link href={`mailto:${contactMail}`}>{children}</Link>,
            link: (children) => (
              <Link href={faq} target="_blank" rel="noreferrer noopener">
                {children}
              </Link>
            ),
          })}
        </p>
      )}
    </Form>
  )
}

export default NewStudyContributorForm
