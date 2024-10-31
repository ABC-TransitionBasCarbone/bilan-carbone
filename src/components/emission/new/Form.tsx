'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useTranslations } from 'next-intl'
import React, { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Unit } from '@prisma/client'
import { CreateEmissionCommand, CreateEmissionCommandValidation } from '@/services/serverFunctions/emission.command'
import { createEmissionCommand } from '@/services/serverFunctions/emission'
import Form from '@/components/base/Form'
import Button from '@/components/base/Button'
import { FormSelect } from '@/components/form/Select'
import { FormTextField } from '@/components/form/TextField'
import { FormControlLabel, FormLabel, MenuItem, Radio, RadioGroup } from '@mui/material'
import DetailedGESFields from './DetailedGESForm'

const NewEmissionForm = () => {
  const router = useRouter()
  const t = useTranslations('emissions.create')
  const tUnit = useTranslations('units')
  const [error, setError] = useState('')
  const [detailedGES, setDetailedGES] = useState(false)

  const form = useForm<CreateEmissionCommand>({
    resolver: zodResolver(CreateEmissionCommandValidation),
    mode: 'onBlur',
    reValidateMode: 'onChange',
    defaultValues: {
      name: '',
      attribute: '',
      unit: '',
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

  const emissionValues = form.watch(['ch4b', 'ch4f', 'co2b', 'co2f', 'n2o', 'sf6', 'hfc', 'pfc', 'otherGES'])
  const totalCo2 = form.watch('totalCo2')
  useEffect(() => {
    if (detailedGES) {
      const newTotal = emissionValues.reduce((acc: number, current) => acc + (current || 0), 0)
      if (totalCo2 !== newTotal) {
        form.setValue('totalCo2', newTotal)
      }
    }
  }, [totalCo2, emissionValues, detailedGES])

  const onSubmit = async (command: CreateEmissionCommand) => {
    const result = await createEmissionCommand(command)
    if (result) {
      setError(result)
    } else {
      router.push('/facteurs-d-emission')
      router.refresh()
    }
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
      {/* {detailedGES && (
        <>
          <FormTextField
            data-testid="new-emission-co2f"
            control={form.control}
            translation={t}
            slotProps={{ htmlInput: { min: 0 } }}
            type="number"
            name="co2f"
            label={t('co2f')}
          />
          <FormTextField
            data-testid="new-emission-ch4f"
            control={form.control}
            translation={t}
            slotProps={{ htmlInput: { min: 0 } }}
            type="number"
            name="ch4f"
            label={t('ch4f')}
          />
          <FormTextField
            data-testid="new-emission-ch4b"
            control={form.control}
            translation={t}
            slotProps={{ htmlInput: { min: 0 } }}
            type="number"
            name="ch4b"
            label={t('ch4b')}
          />
          <FormTextField
            data-testid="new-emission-n2o"
            control={form.control}
            translation={t}
            slotProps={{ htmlInput: { min: 0 } }}
            type="number"
            name="n2o"
            label={t('n2o')}
          />
          <FormTextField
            data-testid="new-emission-co2b"
            control={form.control}
            translation={t}
            slotProps={{ htmlInput: { min: 0 } }}
            type="number"
            name="co2b"
            label={t('co2b')}
          />
          <FormTextField
            data-testid="new-emission-sf6"
            control={form.control}
            translation={t}
            slotProps={{ htmlInput: { min: 0 } }}
            type="number"
            name="sf6"
            label={t('sf6')}
          />
          <FormTextField
            data-testid="new-emission-hfc"
            control={form.control}
            translation={t}
            slotProps={{ htmlInput: { min: 0 } }}
            type="number"
            name="hfc"
            label={t('hfc')}
          />
          <FormTextField
            data-testid="new-emission-pfc"
            control={form.control}
            translation={t}
            slotProps={{ htmlInput: { min: 0 } }}
            type="number"
            name="pfc"
            label={t('pfc')}
          />
          <FormTextField
            data-testid="new-emission-otherGES"
            control={form.control}
            translation={t}
            slotProps={{ htmlInput: { min: 0 } }}
            type="number"
            name="otherGES"
            label={t('otherGES')}
          />
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
      /> */}
      <DetailedGESFields detailedGES={detailedGES} control={form.control} translation={t} totalCo2={totalCo2} />
      <FormTextField control={form.control} translation={t} name="comment" label={t('comment')} multiline rows={2} />
      <Button type="submit" disabled={form.formState.isSubmitting} data-testid="new-emission-create-button">
        {t('create')}
      </Button>
      {error && <p>{error}</p>}
    </Form>
  )
}

export default NewEmissionForm
