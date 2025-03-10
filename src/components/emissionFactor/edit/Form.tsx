'use client'

import Form from '@/components/base/Form'
import { gazKeys } from '@/constants/emissions'
import { DetailedEmissionFactor } from '@/db/emissionFactors'
import { Post } from '@/services/posts'
import { updateEmissionFactorCommand } from '@/services/serverFunctions/emissionFactor'
import {
  maxParts,
  UpdateEmissionFactorCommand,
  UpdateEmissionFactorCommandValidation,
} from '@/services/serverFunctions/emissionFactor.command'
import { getPost } from '@/utils/post'
import { zodResolver } from '@hookform/resolvers/zod'
import { SubPost } from '@prisma/client'
import { useRouter } from 'next/navigation'
import { FormEvent, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import EmissionFactorForm from '../Form/EmissionFactorForm'

type EmissionFactor = Exclude<DetailedEmissionFactor, null>
type Part = Exclude<DetailedEmissionFactor, null>['emissionFactorParts'][0]

interface Props {
  emissionFactor: EmissionFactor
}

const getGazValues = (emissionFactor: EmissionFactor | Part) =>
  gazKeys.reduce((res, gaz) => ({ ...res, [gaz]: emissionFactor[gaz] || 0 }), {})

const getGazTotalValue = (emissionFactor: EmissionFactor | Part) =>
  gazKeys.reduce((res, gaz) => res + (emissionFactor[gaz] || 0), 0)

const isDecomposed = (emissionFactor: EmissionFactor | Part) =>
  gazKeys.some((gaz) => emissionFactor[gaz] && emissionFactor[gaz] > 0)

const buildParts = (emissionFactor: EmissionFactor, partsCount: number) =>
  Array.from({ length: maxParts }, (_, index) => {
    const part = emissionFactor.emissionFactorParts[index]
    if (part && index < partsCount) {
      return {
        name: part.metaData[0].title,
        type: part.type,
        ...getGazValues(part),
        totalCo2: part.totalCo2 || getGazTotalValue(part),
      }
    }
    return { name: '', totalCo2: 0 }
  })

const EditEmissionFactorForm = ({ emissionFactor }: Props) => {
  const router = useRouter()
  const [error, setError] = useState('')
  const [hasParts, setHasParts] = useState(!!(emissionFactor.emissionFactorParts.length > 0))
  const [partsCount, setPartsCount] = useState(emissionFactor.emissionFactorParts.length || 1)

  const subPostObject = useMemo(() => {
    return emissionFactor.subPosts.reduce<Record<Post, SubPost[]>>(
      (acc, subPost) => {
        const post = getPost(subPost)
        if (post) {
          acc[post] = acc[post] ?? []
          acc[post].push(subPost)
        }
        return acc
      },
      {} as Record<Post, SubPost[]>,
    )
  }, [emissionFactor.subPosts])

  const detailedGES =
    isDecomposed(emissionFactor) || (emissionFactor.emissionFactorParts || []).some((part) => isDecomposed(part))

  const form = useForm<UpdateEmissionFactorCommand>({
    resolver: zodResolver(UpdateEmissionFactorCommandValidation),
    mode: 'onBlur',
    reValidateMode: 'onChange',
    defaultValues: {
      id: emissionFactor?.id,
      name: emissionFactor?.metaData[0].title || '',
      attribute: emissionFactor?.metaData[0].attribute || '',
      source: emissionFactor?.source || '',
      unit: emissionFactor?.unit || undefined,
      subPosts: subPostObject,
      ...getGazValues(emissionFactor),
      totalCo2: emissionFactor?.totalCo2 || 0,
      parts: buildParts(emissionFactor, partsCount),
      comment: emissionFactor?.metaData[0].comment || '',
    },
  })

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    form.setValue('parts', hasParts ? form.getValues('parts').slice(0, partsCount) : [])
    form.handleSubmit(async (data) => {
      const result = await updateEmissionFactorCommand(data)

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
        detailedGES={detailedGES}
        error={error}
        hasParts={hasParts}
        setHasParts={setHasParts}
        partsCount={partsCount}
        setPartsCount={setPartsCount}
        button="update"
      />
    </Form>
  )
}

export default EditEmissionFactorForm
