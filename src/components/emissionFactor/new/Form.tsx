'use client'
import Form from '@/components/base/Form'
import { useServerFunction } from '@/hooks/useServerFunction'
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

interface Props {
  locations: string[]
}

const NewEmissionFactorForm = ({ locations }: Props) => {
  const router = useRouter()
  const { callServerFunction } = useServerFunction()
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
      location: '',
      totalCo2: 0,
      parts: Array.from({ length: maxParts }, () => ({ name: '', totalCo2: 0 })),
      comment: '',
      isMonetary: false,
    },
  })

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    form.setValue('parts', hasParts ? form.getValues('parts').slice(0, partsCount) : [])
    form.handleSubmit(async (data) => {
      await callServerFunction(() => createEmissionFactorCommand(data), {
        onSuccess: () => {
          router.push('/facteurs-d-emission')
        },
      })
    })()
  }

  return (
    <Form onSubmit={onSubmit}>
      <EmissionFactorForm
        form={form}
        locations={locations}
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
