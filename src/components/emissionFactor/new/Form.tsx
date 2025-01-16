'use client'

import Form from '@/components/base/Form'
import { defaultGazValues } from '@/constants/emissions'
import { createEmissionFactorCommand } from '@/services/serverFunctions/emissionFactor'
import {
  CreateEmissionFactorCommand,
  CreateEmissionFactorCommandValidation,
  maxParts,
} from '@/services/serverFunctions/emissionFactor.command'
import { zodResolver } from '@hookform/resolvers/zod'
import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { FormEvent, useState } from 'react'
import { useForm } from 'react-hook-form'
import EmissionFactorForm from '../Form/EmissionFactorForm'

const NewEmissionFactorForm = () => {
  const router = useRouter()
  const t = useTranslations('emissionFactors.create')
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

    form.setValue('parts', hasParts ? form.getValues('parts').slice(0, partsCount) : [])
    form.handleSubmit(async (data) => {
      const result = await createEmissionFactorCommand(data)

      if (result) {
        setError(result)
      } else {
        router.push('/facteurs-d-emission')
        router.refresh()
      }
    })()
  }

  return (
    <Form onSubmit={onSubmit}>
      <EmissionFactorForm
        form={form}
        error={error}
        t={t}
        hasParts={hasParts}
        setHasParts={setHasParts}
        partsCount={partsCount}
        setPartsCount={setPartsCount}
      />
    </Form>
  )
}

export default NewEmissionFactorForm
