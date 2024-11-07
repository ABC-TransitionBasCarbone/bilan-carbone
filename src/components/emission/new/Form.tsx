'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useTranslations } from 'next-intl'
import React, { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Unit } from '@prisma/client'
import { CreateEmissionCommand, CreateEmissionCommandValidation } from '@/services/serverFunctions/emission.command'
import { createEmissionCommand } from '@/services/serverFunctions/emission'
import Form from '@/components/base/Form'
import Button from '@/components/base/Button'
import { FormSelect } from '@/components/form/Select'
import { FormTextField } from '@/components/form/TextField'
import { MenuItem } from '@mui/material'
import DetailedGES from './DetailedGES'
import Posts from './Posts'

const NewEmissionForm = () => {
  const router = useRouter()
  const t = useTranslations('emissions.create')
  const tUnit = useTranslations('units')
  const [error, setError] = useState('')
  const [multipleEmissions, setMultiple] = useState(false)
  const [postsCount, setPosts] = useState(1)

  const form = useForm<CreateEmissionCommand>({
    resolver: zodResolver(CreateEmissionCommandValidation),
    mode: 'onBlur',
    reValidateMode: 'onChange',
    defaultValues: {
      name: '',
      attribute: '',
      source: '',
      co2f: 0,
      ch4f: 0,
      ch4b: 0,
      n2o: 0,
      co2b: 0,
      sf6: 0,
      hfc: 0,
      pfc: 0,
      otherGES: 0,
      totalCo2: 0,
      comment: '',
    },
  })

  const onSubmit = async (command: CreateEmissionCommand) => {
    if (multipleEmissions) {
      command.posts = (command.posts || []).filter((_, index) => index < postsCount)
    }
    const result = await createEmissionCommand(command)
    if (result) {
      setError(result)
    } else {
      router.push('/facteurs-d-emission')
      router.refresh()
    }
  }

  const switchMultiple = (value: boolean) => {
    if (!value) {
      form.setValue('posts', undefined)
    }
    setMultiple(value)
  }

  const units = useMemo(() => Object.values(Unit).sort((a, b) => tUnit(a).localeCompare(tUnit(b))), [t])

  return (
    <Form onSubmit={form.handleSubmit(onSubmit)}>
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
        setMultiple={switchMultiple}
        postsCount={postsCount}
        setPosts={setPosts}
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
