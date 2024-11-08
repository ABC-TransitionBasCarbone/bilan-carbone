'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useTranslations } from 'next-intl'
import React, { FormEvent, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Unit } from '@prisma/client'
import {
  CreateEmissionCommand,
  CreateEmissionCommandValidation,
  maxParts,
} from '@/services/serverFunctions/emission.command'
import { createEmissionCommand } from '@/services/serverFunctions/emission'
import Form from '@/components/base/Form'
import Button from '@/components/base/Button'
import { FormSelect } from '@/components/form/Select'
import { FormTextField } from '@/components/form/TextField'
import { MenuItem } from '@mui/material'
import DetailedGES from './DetailedGES'
import Posts from './Posts'
import { defaultGazValues } from '@/constants/emissions'

const NewEmissionForm = () => {
  const router = useRouter()
  const t = useTranslations('emissions.create')
  const tUnit = useTranslations('units')
  const [error, setError] = useState('')
  const [multipleEmissions, setMultipleEmissions] = useState(false)
  const [postsCount, setPostsCount] = useState(1)

  const form = useForm<CreateEmissionCommand>({
    resolver: zodResolver(CreateEmissionCommandValidation),
    mode: 'onBlur',
    reValidateMode: 'onChange',
    defaultValues: {
      name: '',
      attribute: '',
      source: '',
      ...defaultGazValues,
      totalCo2: 0,
      posts: Array.from({ length: maxParts }, () => ({ name: '', type: '', ...defaultGazValues, totalCo2: 0 })),
      comment: '',
    },
  })

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    form.clearErrors()
    const command = form.getValues()
    const isValid = CreateEmissionCommandValidation.safeParse({
      ...command,
      posts: multipleEmissions ? command.posts.slice(0, postsCount) : [],
    })
    if (isValid.success) {
      const result = await createEmissionCommand(isValid.data)

      if (result) {
        setError(result)
      } else {
        router.push('/facteurs-d-emission')
        router.refresh()
      }
    } else {
      isValid.error.errors.forEach((error) => {
        form.setError(error.path.join('.') as keyof CreateEmissionCommand, {
          type: 'manual',
          message: error.message,
        })
      })
    }
  }

  const units = useMemo(() => Object.values(Unit).sort((a, b) => tUnit(a).localeCompare(tUnit(b))), [tUnit])

  return (
    <Form onSubmit={onSubmit}>
      <FormTextField
        data-testid="new-emission-name"
        control={form.control}
        translation={t}
        name="name"
        label={t('name')}
      />
      <FormTextField control={form.control} translation={t} name="attribute" label={t('attribute')} />
      <FormTextField
        data-testid="new-emission-source"
        control={form.control}
        translation={t}
        name="source"
        label={t('source')}
      />
      <FormSelect data-testid="new-emission-unit" control={form.control} translation={t} label={t('unit')} name="unit">
        {units.map((unit) => (
          <MenuItem key={unit} value={unit}>
            {tUnit(unit)}
          </MenuItem>
        ))}
      </FormSelect>
      <DetailedGES
        form={form}
        multipleEmissions={multipleEmissions}
        setMultipleEmissions={setMultipleEmissions}
        postsCount={postsCount}
        setPostsCount={setPostsCount}
      />
      <Posts form={form} />
      <FormTextField control={form.control} translation={t} name="comment" label={t('comment')} multiline rows={2} />
      <Button type="submit" disabled={form.formState.isSubmitting} data-testid="new-emission-create-button">
        {t('create')}
      </Button>
      {error && <p>{error}</p>}
    </Form>
  )
}

export default NewEmissionForm
