'use client'

import Form from '@/components/base/Form'
import { defaultGazValues } from '@/constants/emissions'
import { createEmissionFactorCommand } from '@/services/serverFunctions/emissionFactor'
import {
  EmissionFactorCommand,
  EmissionFactorCommandValidation,
  maxParts,
} from '@/services/serverFunctions/emissionFactor.command'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { FormEvent, useState } from 'react'
import { useForm } from 'react-hook-form'
import EmissionFactorForm from '../Form/EmissionFactorForm'

const NewEmissionFactorForm = () => {
  const router = useRouter()
  const [error, setError] = useState('')
  const [hasParts, setHasParts] = useState(false)
  const [partsCount, setPartsCount] = useState(1)

  const form = useForm<EmissionFactorCommand>({
    resolver: zodResolver(EmissionFactorCommandValidation),
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
        hasParts={hasParts}
        setHasParts={setHasParts}
        partsCount={partsCount}
        setPartsCount={setPartsCount}
        button="create"
      />
    </Form>
  )
}

export default NewEmissionFactorForm
