'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useTranslations } from 'next-intl'
import React, { useEffect, useState } from 'react'
import { FormTextField } from '@/components/form/TextField'
import Button from '@/components/base/Button'
import { useRouter } from 'next/navigation'
import { CreateEmissionCommand, CreateEmissionCommandValidation } from '@/services/serverFunctions/emission.command'
import { createEmissionCommand } from '@/services/serverFunctions/emission'
import Form from '@/components/base/Form'
import { FormControlLabel, FormLabel, Radio, RadioGroup } from '@mui/material'

const NewEmissionForm = () => {
  const router = useRouter()
  const t = useTranslations('emissions.create')
  const [error, setError] = useState('')
  const [detailedGES, setDetailedGES] = useState(false)

  const form = useForm<CreateEmissionCommand>({
    resolver: zodResolver(CreateEmissionCommandValidation),
    mode: 'onBlur',
    reValidateMode: 'onChange',
  })

  const emissionValues = form.watch(['ch4b', 'ch4f', 'co2b', 'co2f', 'n2o', 'otherGES'])
  const totalCo2 = form.watch('totalCo2')
  useEffect(() => {
    if (detailedGES) {
      const newTotal = emissionValues.reduce((acc: number, current) => acc + (current || 0), 0)
      if (totalCo2 !== newTotal) form.setValue('totalCo2', newTotal)
    }
  }, [totalCo2, emissionValues, detailedGES])

  const onSubmit = async (command: CreateEmissionCommand) => {
    const result = await createEmissionCommand(command)
    if (result) {
      setError(result)
    } else {
      router.push('/facteurs-d-emission')
    }
  }

  return (
    <Form onSubmit={form.handleSubmit(onSubmit)}>
      <FormTextField
        data-testid="new-emission-name"
        control={form.control}
        translation={t}
        name="name"
        label={t('name')}
      ></FormTextField>
      <FormTextField control={form.control} translation={t} name="attribute" label={t('attribute')}></FormTextField>
      <FormTextField
        data-testid="new-emission-unit"
        control={form.control}
        translation={t}
        name="unit"
        label={t('unit')}
      ></FormTextField>
      <FormTextField
        data-testid="new-emission-source"
        control={form.control}
        translation={t}
        name="source"
        label={t('source')}
      ></FormTextField>
      <div>
        <FormLabel id={`defailedGES-radio-group-label`} component="legend">
          {t('detailedGES')}
        </FormLabel>
        <RadioGroup
          aria-labelledby={`defailedGES-radio-group-label`}
          value={detailedGES}
          onChange={(event) => setDetailedGES(event.target.value === 'true')}
        >
          <FormControlLabel
            value="true"
            control={<Radio />}
            label={t('yes')}
            data-testid="new-emission-detailedGES-true"
          />
          <FormControlLabel
            value="false"
            control={<Radio />}
            label={t('no')}
            data-testid="new-emission-detailedGES-false"
          />
        </RadioGroup>
      </div>
      {detailedGES && (
        <>
          <FormTextField
            data-testid="new-emission-co2f"
            control={form.control}
            translation={t}
            slotProps={{ htmlInput: { min: 0 } }}
            type="number"
            name="co2f"
            label={t('co2f')}
          ></FormTextField>
          <FormTextField
            data-testid="new-emission-ch4f"
            control={form.control}
            translation={t}
            slotProps={{ htmlInput: { min: 0 } }}
            type="number"
            name="ch4f"
            label={t('ch4f')}
          ></FormTextField>
          <FormTextField
            data-testid="new-emission-ch4b"
            control={form.control}
            translation={t}
            slotProps={{ htmlInput: { min: 0 } }}
            type="number"
            name="ch4b"
            label={t('ch4b')}
          ></FormTextField>
          <FormTextField
            data-testid="new-emission-n2o"
            control={form.control}
            translation={t}
            slotProps={{ htmlInput: { min: 0 } }}
            type="number"
            name="n2o"
            label={t('n2o')}
          ></FormTextField>
          <FormTextField
            data-testid="new-emission-co2b"
            control={form.control}
            translation={t}
            slotProps={{ htmlInput: { min: 0 } }}
            type="number"
            name="co2b"
            label={t('co2b')}
          ></FormTextField>
          <FormTextField
            data-testid="new-emission-otherGES"
            control={form.control}
            translation={t}
            slotProps={{ htmlInput: { min: 0 } }}
            type="number"
            name="otherGES"
            label={t('otherGES')}
          ></FormTextField>
        </>
      )}
      <FormTextField
        disabled={detailedGES}
        data-testid="new-emission-totalCo2"
        control={form.control}
        translation={t}
        slotProps={{
          htmlInput: { min: 0 },
          inputLabel: { shrink: detailedGES || totalCo2 !== undefined ? true : undefined },
        }}
        type="number"
        name="totalCo2"
        label={t('totalCo2')}
      ></FormTextField>
      <FormTextField
        control={form.control}
        translation={t}
        name="comment"
        label={t('comment')}
        multiline
        rows={2}
      ></FormTextField>
      <Button type="submit" disabled={form.formState.isSubmitting} data-testid="new-emission-create-button">
        {t('create')}
      </Button>
      {error && <p>{error}</p>}
    </Form>
  )
}

export default NewEmissionForm
