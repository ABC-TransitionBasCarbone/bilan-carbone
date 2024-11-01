'use client'

import React, { useEffect, useState } from 'react'
import { UseFormReturn } from 'react-hook-form'
import { FormTextField } from '@/components/form/TextField'
import { CreateEmissionCommand } from '@/services/serverFunctions/emission.command'
import { FormControlLabel, FormLabel, Radio, RadioGroup } from '@mui/material'
import { useTranslations } from 'next-intl'

interface Props {
  form: UseFormReturn<CreateEmissionCommand>
}

const DetailedGES = ({ form }: Props) => {
  const t = useTranslations('emissions.create')
  const [detailedGES, setDetailedGES] = useState(false)

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

  return (
    <>
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
      />
    </>
  )
}

export default DetailedGES
