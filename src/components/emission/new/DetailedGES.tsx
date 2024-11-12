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
import EmissionPostForm from './EmissionPostForm'
import { gazKeys } from '@/constants/emissions'

interface Props {
  form: UseFormReturn<CreateEmissionCommand>
  multipleEmissions: boolean
  setMultipleEmissions: (value: boolean) => void
  postsCount: number
  setPostsCount: (value: number) => void
}

const DetailedGES = ({ form, multipleEmissions, setMultipleEmissions, postsCount, setPostsCount }: Props) => {
  const t = useTranslations('emissions.create')
  const [detailedGES, setDetailedGES] = useState(false)

  const emissionValues = form.watch(gazKeys)
  useEffect(() => {
    if (detailedGES && !multipleEmissions) {
      const total = emissionValues.filter((value) => value !== undefined).reduce((acc, current) => acc + current, 0)
      form.setValue('totalCo2', total)
    }
  }, [form, detailedGES, ...emissionValues])

  const emissionPostsValues = form.watch(
    // @ts-expect-error cannot force type
    Array.from({ length: maxParts }).flatMap((_, index) => gazKeys.map((key) => `posts.${index}.${key}`)),
  )
  useEffect(() => {
    if (multipleEmissions && detailedGES) {
      const values = form.getValues('posts')
      const emissions = values.filter((_, index) => index < postsCount)

      let totalCo2 = 0
      emissions.forEach((post, index) => {
        const postTotalCo2 = gazKeys.reduce((acc, gaz) => acc + post[gaz], 0)
        totalCo2 += postTotalCo2
        form.setValue(`posts.${index}.totalCo2`, postTotalCo2)
      })
      form.setValue('totalCo2', totalCo2)
    }
  }, [detailedGES, form, postsCount, multipleEmissions, ...emissionPostsValues])

  const emissionPostsTotal = form.watch(
    // @ts-expect-error cannot force type
    Array.from({ length: maxParts }).map((_, index) => `posts.${index}.totalCo2`),
  )
  useEffect(() => {
    if (multipleEmissions && !detailedGES) {
      const values = form.getValues('posts')
      const emissions = values.filter((_, index) => index < postsCount)
      form.setValue(
        'totalCo2',
        emissions.reduce((acc, current) => acc + current.totalCo2, 0 as number),
      )
    }
  }, [detailedGES, form, postsCount, multipleEmissions, ...emissionPostsTotal])

  const updateEmissionPostsCount = (value: string) => {
    const count = Number(value)
    if (!value || Number.isNaN(count)) {
      setPostsCount(-1)
    } else {
      setPostsCount(count > maxParts ? maxParts : count)
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
              <FormLabel id="sub-posts-count-label" component="legend">
                {t('subPostsCount')}
              </FormLabel>
              <TextField
                type="number"
                slotProps={{ htmlInput: { min: 1, max: maxParts } }}
                value={postsCount < 0 ? '' : postsCount}
                onChange={(e) => updateEmissionPostsCount(e.target.value)}
                data-testid="new-emission-sub-posts-count"
              />
            </>
          )}
        </div>
      </div>
      {multipleEmissions ? (
        <>
          {Array.from({ length: postsCount }).map((_, index) => (
            <EmissionPostForm key={`emission-post-${index}`} detailedGES={detailedGES} form={form} index={index} />
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
