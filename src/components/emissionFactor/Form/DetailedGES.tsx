'use client'

import { FormTextField } from '@/components/form/TextField'
import { gazKeys } from '@/constants/emissions'
import { CreateEmissionFactorCommand, maxParts } from '@/services/serverFunctions/emissionFactor.command'
import { FormControlLabel, FormLabel, Switch, TextField } from '@mui/material'
import classNames from 'classnames'
import { useTranslations } from 'next-intl'
import { useEffect, useState } from 'react'
import { Control, UseFormGetValues, UseFormReturn, UseFormSetValue } from 'react-hook-form'
import styles from './DetailedGES.module.css'
import DetailedGESFields from './DetailedGESFields'
import EmissionFactorPartForm from './EmissionFactorPartForm'

interface Props<T extends CreateEmissionFactorCommand> {
  form: UseFormReturn<T>
  initialDetailedGES?: boolean
  hasParts: boolean
  setHasParts: (value: boolean) => void
  partsCount: number
  setPartsCount: (value: number) => void
}

const DetailedGES = <T extends CreateEmissionFactorCommand>({
  form,
  initialDetailedGES,
  hasParts,
  setHasParts,
  partsCount,
  setPartsCount,
}: Props<T>) => {
  const t = useTranslations('emissionFactors.create')
  const [detailedGES, setDetailedGES] = useState<boolean>(initialDetailedGES || false)

  const control = form.control as Control<CreateEmissionFactorCommand>
  const setValue = form.setValue as UseFormSetValue<CreateEmissionFactorCommand>
  const getValues = form.getValues as UseFormGetValues<CreateEmissionFactorCommand>

  const emissionFactorValues = (form as UseFormReturn<CreateEmissionFactorCommand>).watch(
    gazKeys.filter((key) => !key.endsWith('b')),
  )

  useEffect(() => {
    if (detailedGES && !hasParts) {
      const total = emissionFactorValues
        .filter((value) => value !== undefined)
        .reduce((acc, current) => acc + (current || 0), 0)
      setValue('totalCo2', total)
    }
  }, [form, hasParts, detailedGES, ...emissionFactorValues])

  const emissionFactorPartsValues = form.watch(
    // @ts-expect-error cannot force type
    Array.from({ length: maxParts }).flatMap((_, index) => gazKeys.map((key) => `parts.${index}.${key}`)),
  )

  useEffect(() => {
    if (hasParts && detailedGES) {
      const values = getValues('parts')
      const emissionFactors = values.filter((_, index) => index < partsCount)

      let totalCo2 = 0
      emissionFactors.forEach((part, index) => {
        const partTotalCo2 = gazKeys.filter((key) => !key.endsWith('b')).reduce((acc, gaz) => acc + (part[gaz] || 0), 0)
        totalCo2 += partTotalCo2
        setValue(`parts.${index}.totalCo2`, partTotalCo2)
      })
      setValue('totalCo2', totalCo2)
    }
  }, [detailedGES, form, partsCount, hasParts, ...emissionFactorPartsValues])

  const emissionFactorPartsTotal = form.watch(
    // @ts-expect-error cannot force type
    Array.from({ length: maxParts }).map((_, index) => `parts.${index}.totalCo2`),
  )
  useEffect(() => {
    if (hasParts && !detailedGES) {
      const values = getValues('parts')
      const emissionFactors = values.filter((_, index) => index < partsCount)
      setValue(
        'totalCo2',
        emissionFactors.reduce((acc, current) => acc + current.totalCo2, 0 as number),
      )
    }
  }, [detailedGES, form, partsCount, hasParts, ...emissionFactorPartsTotal])

  const updateEmissionFactorPartsCount = (value: string) => {
    const count = Number(value)
    if (!value || Number.isNaN(count)) {
      setPartsCount(-1)
    } else {
      setPartsCount(count > maxParts ? maxParts : count)
    }
  }

  const deletePart = (i: number) => {
    if (partsCount > 1) {
      const parts = getValues('parts')
      const [element] = parts.splice(i, 1)
      parts.splice(partsCount - 1, 0, element)
      setValue('parts', parts)
      setPartsCount(partsCount - 1)
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
                data-testid="emission-factor-detailed-switch"
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
                checked={hasParts}
                onChange={(event) => setHasParts(event.target.checked)}
                data-testid="emission-factor-multiple-switch"
              />
            }
            label={t(hasParts ? 'yes' : 'no')}
          />
        </div>
        <div className={styles.input}>
          {hasParts && (
            <>
              <FormLabel id="sub-parts-count-label" component="legend">
                {t('subPartsCount')}
              </FormLabel>
              <TextField
                type="number"
                value={partsCount < 0 ? '' : partsCount}
                onChange={(e) => updateEmissionFactorPartsCount(e.target.value)}
                data-testid="emission-factor-parts-count"
                slotProps={{
                  htmlInput: { min: 1, max: maxParts },
                  input: { onWheel: (event) => (event.target as HTMLInputElement).blur() },
                }}
              />
            </>
          )}
        </div>
      </div>
      {hasParts ? (
        <>
          {Array.from({ length: partsCount }).map((_, index) => (
            <EmissionFactorPartForm
              key={`emission-part-${index}`}
              detailedGES={detailedGES}
              form={form}
              index={index}
              partsCount={partsCount}
              deletePart={deletePart}
            />
          ))}
        </>
      ) : (
        detailedGES && <DetailedGESFields form={form} />
      )}
      <FormTextField
        disabled={detailedGES || hasParts}
        data-testid="emission-factor-totalCo2"
        control={control}
        translation={t}
        slotProps={{
          htmlInput: { min: 0 },
          inputLabel: { shrink: true },
          input: { onWheel: (event) => (event.target as HTMLInputElement).blur() },
        }}
        type="number"
        name="totalCo2"
        label={t('totalCo2')}
      />
    </>
  )
}

export default DetailedGES
