'use client'

import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import { UseFormReturn } from 'react-hook-form'
import classNames from 'classnames'
import styles from './DetailedGES.module.css'
import { FormTextField } from '@/components/form/TextField'
import { CreateEmissionCommand, maxParts } from '@/services/serverFunctions/emission.command'
import { FormControlLabel, FormLabel, Switch, TextField } from '@mui/material'
import DetailedGESFields from './DetailedGESFields'
import EmissionPartForm from './EmissionPartForm'
import { gazKeys } from '@/constants/emissions'

interface Props {
  form: UseFormReturn<CreateEmissionCommand>
  multipleEmissions: boolean
  setMultipleEmissions: (value: boolean) => void
  partsCount: number
  setPartsCount: (value: number) => void
}

const DetailedGES = ({ form, multipleEmissions, setMultipleEmissions, partsCount, setPartsCount }: Props) => {
  const t = useTranslations('emissions.create')
  const [detailedGES, setDetailedGES] = useState(false)

  const emissionValues = form.watch(gazKeys)
  useEffect(() => {
    if (detailedGES && !multipleEmissions) {
      const total = emissionValues.filter((value) => value !== undefined).reduce((acc, current) => acc + current, 0)
      form.setValue('totalCo2', total)
    }
  }, [form, detailedGES, ...emissionValues])

  const emissionPartsValues = form.watch(
    // @ts-expect-error cannot force type
    Array.from({ length: maxParts }).flatMap((_, index) => gazKeys.map((key) => `parts.${index}.${key}`)),
  )
  useEffect(() => {
    if (multipleEmissions && detailedGES) {
      const values = form.getValues('parts')
      const emissions = values.filter((_, index) => index < partsCount)

      let totalCo2 = 0
      emissions.forEach((part, index) => {
        const partTotalCo2 = gazKeys.reduce((acc, gaz) => acc + part[gaz], 0)
        totalCo2 += partTotalCo2
        form.setValue(`parts.${index}.totalCo2`, partTotalCo2)
      })
      form.setValue('totalCo2', totalCo2)
    }
  }, [detailedGES, form, partsCount, multipleEmissions, ...emissionPartsValues])

  const emissionPartsTotal = form.watch(
    // @ts-expect-error cannot force type
    Array.from({ length: maxParts }).map((_, index) => `parts.${index}.totalCo2`),
  )
  useEffect(() => {
    if (multipleEmissions && !detailedGES) {
      const values = form.getValues('parts')
      const emissions = values.filter((_, index) => index < partsCount)
      form.setValue(
        'totalCo2',
        emissions.reduce((acc, current) => acc + current.totalCo2, 0 as number),
      )
    }
  }, [detailedGES, form, partsCount, multipleEmissions, ...emissionPartsTotal])

  const updateEmissionPartsCount = (value: string) => {
    const count = Number(value)
    if (!value || Number.isNaN(count)) {
      setPartsCount(-1)
    } else {
      setPartsCount(count > maxParts ? maxParts : count)
    }
  }

  return (
    <>
      <div className={classNames(styles.questions, 'flex')}>
        <div className={styles.selector}>
          <FormLabel id="defailedGES-radio-group-label" component="legend">
            {t('detailedGES')}
          </FormLabel>
          <FormControlLabel
            control={
              <Switch
                checked={detailedGES}
                onChange={(event) => setDetailedGES(event.target.checked)}
                data-testid="new-emission-detailed-switch"
              />
            }
            label={t(detailedGES ? 'yes' : 'no')}
          />
        </div>
        <div className={styles.selector}>
          <FormLabel id="multiple-emssions-radio-group-label" component="legend">
            {t('multiple')}
          </FormLabel>
          <FormControlLabel
            control={
              <Switch
                checked={multipleEmissions}
                onChange={(event) => {
                  setMultipleEmissions(event.target.checked)
                }}
                data-testid="new-emission-multiple-switch"
              />
            }
            label={t(multipleEmissions ? 'yes' : 'no')}
          />
        </div>
        <div className={styles.input}>
          {multipleEmissions && (
            <>
              <FormLabel id="sub-parts-count-label" component="legend">
                {t('subPartsCount')}
              </FormLabel>
              <TextField
                type="number"
                value={partsCount < 0 ? '' : partsCount}
                onChange={(e) => updateEmissionPartsCount(e.target.value)}
                data-testid="new-emission-parts-count"
                slotProps={{ htmlInput: { min: 1, max: maxParts } }}
              />
            </>
          )}
        </div>
      </div>
      {multipleEmissions ? (
        <>
          {Array.from({ length: partsCount }).map((_, index) => (
            <EmissionPartForm key={`emission-part-${index}`} detailedGES={detailedGES} form={form} index={index} />
          ))}
        </>
      ) : (
        detailedGES && <DetailedGESFields form={form} index={0} />
      )}
      <FormTextField
        disabled={detailedGES || multipleEmissions}
        data-testid="new-emission-totalCo2"
        control={form.control}
        translation={t}
        slotProps={{
          htmlInput: { min: 0 },
          inputLabel: { shrink: true },
        }}
        type="number"
        name="totalCo2"
        label={t('totalCo2')}
      />
    </>
  )
}

export default DetailedGES
