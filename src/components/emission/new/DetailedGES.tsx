'use client'

import { useCallback, useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import { UseFormReturn } from 'react-hook-form'
import classNames from 'classnames'
import styles from './DetailedGES.module.css'
import { FormTextField } from '@/components/form/TextField'
import { CreateEmissionCommand } from '@/services/serverFunctions/emission.command'
import { FormControlLabel, FormLabel, Switch, TextField } from '@mui/material'
import DetailedGESFields from './DetailedGESFields'
import EmissionPostForm from './EmissionPostForm'
import { gazKeys } from '@/constants/emissions'

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

  const emissionValues = form.watch(gazKeys)
  const stringifiedEmissionValues = JSON.stringify(emissionValues)
  const emissionPostsValues = form.watch(['posts'])
  const stringifiedEmissionPostsValues = JSON.stringify(emissionPostsValues[0])
  const totalCo2 = form.watch('totalCo2')

  const updateTotalCo2 = useCallback(
    (value: number) => {
      if (value !== totalCo2) {
        form.setValue('totalCo2', value)
      }
    },
    [totalCo2, form],
  )

  useEffect(() => {
    if (detailedGES && !multipleEmissions) {
      updateTotalCo2(getTotalForDetailedGES())
    }
  }, [totalCo2, updateTotalCo2, stringifiedEmissionValues, detailedGES])

  useEffect(() => {
    let totalCo2 = 0
    if (detailedGES) {
      emissionPostsValues[0]
        ?.filter((value, index) => value !== undefined && index < postsCount)
        .forEach((post, index) => {
          const postTotalCo2 = gazKeys.reduce((acc, gaz) => acc + (post[gaz] || 0), 0)
          totalCo2 += postTotalCo2
          updatePostTotalCo2(index, postTotalCo2)
        })
      updateTotalCo2(totalCo2)
    } else {
      updateTotalCo2(getTotalForMultipleGES())
    }
  }, [postsCount, stringifiedEmissionPostsValues])

  const getTotalForDetailedGES = () =>
    emissionValues.filter((value) => value !== undefined).reduce((acc, current) => acc + current, 0)

  const getTotalForMultipleGES = () =>
    (emissionPostsValues[0] || [])
      .filter((_, i) => (multipleEmissions ? i < postsCount : i === 0))
      .reduce((acc, current) => acc + (current.totalCo2 || 0), 0)

  const updatePostTotalCo2 = (index: number, value: number) => {
    if (form.getValues(`posts.${index}.totalCo2`) !== value) {
      form.setValue(`posts.${index}.totalCo2`, value)
    }
  }

  const updateEmissionPostsCount = (count: number) => {
    setPosts(count)
    if (count > (form.getValues('posts') || []).length) {
      const newElement = gazKeys.reduce((acc, gaz) => ({ ...acc, [gaz]: 0 }), { name: '', type: '', totalCo2: 0 })
      form.setValue('posts', (form.getValues('posts') || []).concat(newElement))
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
                onChange={(event) => setMultiple(event.target.checked)}
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
                slotProps={{ htmlInput: { min: 1, max: 5 } }}
                defaultValue={postsCount}
                onChange={(e) => updateEmissionPostsCount(Number(e.target.value))}
                data-testid="new-emission-sub-posts-count"
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
        disabled={detailedGES || multipleEmissions}
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
