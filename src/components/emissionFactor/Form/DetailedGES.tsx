'use client'

import HelpIcon from '@/components/base/HelpIcon'
import { FormTextField } from '@/components/form/TextField'
import GlossaryModal from '@/components/modals/GlossaryModal'
import { gazKeys } from '@/constants/emissions'
import { EmissionFactorCommand, maxParts } from '@/services/serverFunctions/emissionFactor.command'
import { FormControlLabel, FormLabel, Switch, TextField } from '@mui/material'
import classNames from 'classnames'
import { useTranslations } from 'next-intl'
import { useEffect, useState } from 'react'
import { Control, UseFormGetValues, UseFormReturn, UseFormSetValue } from 'react-hook-form'
import styles from './DetailedGES.module.css'
import DetailedGESFields from './DetailedGESFields'
import EmissionFactorPartForm from './EmissionFactorPartForm'
import EmissionFactorFormDescription from './GlossaryDescriptions'

interface Props<T extends EmissionFactorCommand> {
  form: UseFormReturn<T>
  initialDetailedGES?: boolean
  hasParts: boolean
  setHasParts: (value: boolean) => void
  partsCount: number
  setPartsCount: (value: number) => void
}

const DetailedGES = <T extends EmissionFactorCommand>({
  form,
  initialDetailedGES,
  hasParts,
  setHasParts,
  partsCount,
  setPartsCount,
}: Props<T>) => {
  const t = useTranslations('emissionFactors.create')
  const tGlossary = useTranslations('emissionFactors.create.glossary')
  const [detailedGES, setDetailedGES] = useState<boolean>(initialDetailedGES || false)
  const [glossary, setGlossary] = useState('')

  const control = form.control as Control<EmissionFactorCommand>
  const setValue = form.setValue as UseFormSetValue<EmissionFactorCommand>
  const getValues = form.getValues as UseFormGetValues<EmissionFactorCommand>

  const emissionFactorValues = (form as UseFormReturn<EmissionFactorCommand>).watch(
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
          <FormLabel id="defailedGES-radio-group-label" component="legend" className="inputLabel align-center">
            <span className="bold">{t('detailedGES')}</span>
            <HelpIcon className="ml-2" onClick={() => setGlossary('detailedGES')} label={tGlossary('title')} />
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
          <FormLabel id="multiple-emssions-radio-group-label" component="legend" className="inputLabel align-center">
            <span className="bold">{t('multiple')}</span>
            <HelpIcon className="ml-2" onClick={() => setGlossary('multiple')} label={tGlossary('title')} />
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
              <FormLabel id="sub-parts-count-label" component="legend" className="inputLabel align-center">
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
        slotProps={{
          htmlInput: { min: 0 },
          inputLabel: { shrink: true },
          input: { onWheel: (event) => (event.target as HTMLInputElement).blur() },
        }}
        type="number"
        name="totalCo2"
        label={t('totalCo2')}
      />
      <GlossaryModal glossary={glossary} onClose={() => setGlossary('')} label="create-emission-factor" t={tGlossary}>
        <EmissionFactorFormDescription field={glossary} />
      </GlossaryModal>
    </>
  )
}

export default DetailedGES
