'use client'

import Button from '@/components/base/Button'
import Form from '@/components/base/Form'
import { FormSelect } from '@/components/form/Select'
import { FormTextField } from '@/components/form/TextField'
import { defaultGazValues } from '@/constants/emissions'
import { createEmissionFactorCommand } from '@/services/serverFunctions/emissionFactor'
import {
  CreateEmissionFactorCommand,
  CreateEmissionFactorCommandValidation,
  maxParts,
} from '@/services/serverFunctions/emissionFactor.command'
import { zodResolver } from '@hookform/resolvers/zod'
import { MenuItem } from '@mui/material'
import { Unit } from '@prisma/client'
import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { FormEvent, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import DetailedGES from './DetailedGES'
import Posts from './Posts'

const NewEmissionFactorForm = () => {
  const router = useRouter()
  const t = useTranslations('emissionFactors.create')
  const tUnit = useTranslations('units')
  const [error, setError] = useState('')
  const [hasParts, setHasParts] = useState(false)
  const [partsCount, setPartsCount] = useState(1)

  const form = useForm<CreateEmissionFactorCommand>({
    resolver: zodResolver(CreateEmissionFactorCommandValidation),
    mode: 'onBlur',
    reValidateMode: 'onChange',
    defaultValues: {
      name: '',
      attribute: '',
      source: '',
      ...defaultGazValues,
      totalCo2: 0,
      parts: Array.from({ length: maxParts }, () => ({ name: '', ...defaultGazValues, totalCo2: 0 })),
      comment: '',
    },
  })

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    form.clearErrors()
    const command = form.getValues()
    const isValid = CreateEmissionFactorCommandValidation.safeParse({
      ...command,
      parts: hasParts ? command.parts.slice(0, partsCount) : [],
    })
    if (isValid.success) {
      const result = await createEmissionFactorCommand(isValid.data)

      if (result) {
        setError(result)
      } else {
        router.push('/facteurs-d-emission')
        router.refresh()
      }
    } else {
      isValid.error.errors.forEach((error) => {
        form.setError(error.path.join('.') as keyof CreateEmissionFactorCommand, {
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
        hasParts={hasParts}
        setHasParts={setHasParts}
        partsCount={partsCount}
        setPartsCount={setPartsCount}
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

export default NewEmissionFactorForm
