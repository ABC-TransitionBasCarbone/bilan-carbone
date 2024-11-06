/* eslint-disable react-hooks/exhaustive-deps */
'use client'

import { useEffect, useState } from 'react'
import { UseFormReturn } from 'react-hook-form'
import styles from './DetailedGES.module.css'
import { FormTextField } from '@/components/form/TextField'
import { CreateEmissionCommand } from '@/services/serverFunctions/emission.command'
import { FormControlLabel, FormLabel, Radio, RadioGroup, TextField } from '@mui/material'
import { useTranslations } from 'next-intl'
import DetailedGESFields from './DetailedGESFields'
import EmissionPostForm from './EmissionPostForm'

interface Props {
  form: UseFormReturn<CreateEmissionCommand>
  multipleEmissions: boolean
  setMultiple: (value: boolean) => void
  postsCount: number
  setPosts: (value: number) => void
}

const DetailedGES = ({ form, multipleEmissions, setMultiple, postsCount, setPosts }: Props) => {
  const t = useTranslations('emissions.create')
  const [detailedGES, setDetailedGES] = useState(false)

  const emissionValues = form.watch(['ch4b', 'ch4f', 'co2b', 'co2f', 'n2o', 'sf6', 'hfc', 'pfc', 'otherGES'])
  const emissionPostsValues = form.watch('posts') || []
  const totalCo2 = form.watch('totalCo2')

  useEffect(() => {
    if (detailedGES) {
      const newTotal = emissionValues
        .filter((value) => value !== undefined)
        .reduce(
          (acc, current) =>
            acc +
            current
              .filter((_, i) => (multipleEmissions ? i < postsCount : i === 0))
              .reduce((acc: number, current: number) => acc + current, 0),
          0,
        )
      if (totalCo2 !== newTotal) {
        form.setValue('totalCo2', newTotal)
      }
    } else {
      if (multipleEmissions) {
        const newTotal = emissionPostsValues
          .filter((_, i) => (multipleEmissions ? i < postsCount : i === 0))
          .reduce((acc: number, current) => acc + (current.totalCo2 || 0), 0)
        if (totalCo2 !== newTotal) {
          form.setValue('totalCo2', newTotal)
        }
      }
    }
  }, [totalCo2, emissionValues, emissionPostsValues, detailedGES])

  const updateEmissionPostsCount = (count: number) => {
    setPosts(count)
    if (count > (form.getValues('co2f') || []).length) {
      const keys = ['co2f', 'ch4f', 'ch4b', 'n2o', 'co2b', 'sf6', 'hfc', 'pfc', 'otherGES'] as const
      keys.forEach((key) => form.setValue(key, [...(form.getValues(key) || []), 0]))
      form.setValue('posts', (form.getValues('posts') || []).concat([{ name: '', type: '', totalCo2: 0 }]))
    }
  }
  return (
    <>
      <div className={`${styles.questions} flex`}>
        <div className={styles.selector}>
          <FormLabel id={`defailedGES-radio-group-label`} component="legend">
            {t('detailedGES')}
          </FormLabel>
          <RadioGroup
            aria-labelledby={`defailedGES-radio-group-label`}
            value={detailedGES}
            onChange={(event) => setDetailedGES(event.target.value === 'true')}
          >
            <FormControlLabel
              value="false"
              control={<Radio />}
              label={t('no')}
              data-testid="new-emission-detailedGES-false"
            />
            <FormControlLabel
              value="true"
              control={<Radio />}
              label={t('yes')}
              data-testid="new-emission-detailedGES-true"
            />
          </RadioGroup>
        </div>
        <div className={styles.selector}>
          <FormLabel id={`multiple-emssions-radio-group-label`} component="legend">
            {t('multiple')}
          </FormLabel>
          <RadioGroup
            aria-labelledby={`multiple-emssions-radio-group-labe`}
            value={multipleEmissions}
            onChange={(event) => setMultiple(event.target.value === 'true')}
          >
            <FormControlLabel
              value={'false'}
              control={<Radio />}
              label={t('no')}
              data-testid="new-emission-multiple-false"
            />
            <FormControlLabel
              value={'true'}
              control={<Radio />}
              label={t('yes')}
              data-testid="new-emission-multiple-true"
            />
          </RadioGroup>
        </div>
        <div className={styles.input}>
          {multipleEmissions && (
            <>
              <FormLabel id={`sub-posts-count-label`} component="legend">
                {t('subPostsCount')}
              </FormLabel>
              <TextField
                type="number"
                slotProps={{ htmlInput: { min: 1, max: 5 } }}
                defaultValue={postsCount}
                onChange={(e) => updateEmissionPostsCount(Number(e.target.value))}
              />
            </>
          )}
        </div>
      </div>
      {multipleEmissions ? (
        <>
          {Array.from({ length: postsCount }).map((_, index) => (
            <EmissionPostForm
              key={`emission-post-${index}`}
              detailedGES={detailedGES}
              form={form}
              index={index}
              totalCo2={totalCo2}
            />
          ))}
        </>
      ) : (
        detailedGES && <DetailedGESFields form={form} index={0} />
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
