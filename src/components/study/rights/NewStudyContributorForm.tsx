'use client'

import Form from '@/components/base/Form'
import LoadingButton from '@/components/base/LoadingButton'
import { FormSelect } from '@/components/form/Select'
import { FormTextField } from '@/components/form/TextField'
import { FullStudy } from '@/db/study'
import { BCPost, subPostsByPost } from '@/services/posts'
import { newStudyContributor } from '@/services/serverFunctions/study'
import {
  NewStudyContributorCommand,
  NewStudyContributorCommandValidation,
} from '@/services/serverFunctions/study.command'
import { zodResolver } from '@hookform/resolvers/zod'
import { MenuItem } from '@mui/material'
import { SubPost } from '@prisma/client'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'

interface Props {
  study: FullStudy
}

const faq = process.env.NEXT_PUBLIC_ABC_FAQ_LINK || ''
const contactMail = process.env.NEXT_PUBLIC_ABC_SUPPORT_MAIL

const NewStudyContributorForm = ({ study }: Props) => {
  const router = useRouter()
  const t = useTranslations('study.rights.newContributor')
  const tPost = useTranslations('emissionFactors.post')

  const [error, setError] = useState('')

  const form = useForm<NewStudyContributorCommand>({
    resolver: zodResolver(NewStudyContributorCommandValidation),
    mode: 'onBlur',
    reValidateMode: 'onChange',
    defaultValues: {
      studyId: study.id,
      email: '',
      subPost: 'all',
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

  const post = form.watch('post')

  useEffect(() => {
    form.setValue('subPost', 'all')
  }, [post, form])

  return (
    <Form onSubmit={form.handleSubmit(onSubmit)}>
      <FormTextField
        data-testid="study-contributor-email"
        control={form.control}
        translation={t}
        name="email"
        label={t('email')}
      />
      <FormSelect
        control={form.control}
        translation={t}
        name="post"
        label={t('post')}
        data-testid="study-contributor-post"
      >
        <MenuItem value="all">{tPost('allPost')}</MenuItem>
        {Object.keys(BCPost).map((key) => (
          <MenuItem key={key} value={key}>
            {tPost(key)}
          </MenuItem>
        ))}
      </FormSelect>
      {post && post !== 'all' && (
        <FormSelect
          control={form.control}
          translation={t}
          name="subPost"
          label={t('subPost')}
          data-testid="study-contributor-subPost"
        >
          <MenuItem value="all">{tPost('allSubPost')}</MenuItem>
          {Object.values(SubPost)
            .filter((subPost) => subPostsByPost[post].includes(subPost))
            .map((subPost) => (
              <MenuItem key={subPost} value={subPost}>
                {tPost(subPost)}
              </MenuItem>
            ))}
        </FormSelect>
      )}
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
