'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useTranslations } from 'next-intl'
import React, { useEffect, useState } from 'react'
import Button from '@/components/base/Button'
import { useRouter } from 'next/navigation'
import Form from '@/components/base/Form'
import { MenuItem } from '@mui/material'
import { SubPost } from '@prisma/client'
import { FullStudy } from '@/db/study'
import { FormSelect } from '@/components/form/Select'
import {
  NewStudyContributorCommand,
  NewStudyContributorCommandValidation,
} from '@/services/serverFunctions/study.command'
import { newStudyContributor } from '@/services/serverFunctions/study'
import { Post, subPostsByPost } from '@/services/posts'
import { FormTextField } from '@/components/form/TextField'

interface Props {
  study: FullStudy
}

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
      router.push(`/etudes/${study.id}/droits`)
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
        {Object.keys(Post).map((key) => (
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
      <Button type="submit" disabled={form.formState.isSubmitting} data-testid="study-contributor-create-button">
        {t('create')}
      </Button>
      {error && <p>{error}</p>}
    </Form>
  )
}

export default NewStudyContributorForm
