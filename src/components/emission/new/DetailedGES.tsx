'use client'

import { useEffect, useState } from 'react'
import { UseFormReturn } from 'react-hook-form'
import styles from './styles.module.css'
import { FormTextField } from '@/components/form/TextField'
import { CreateEmissionCommand } from '@/services/serverFunctions/emission.command'
import { FormControlLabel, FormLabel, Radio, RadioGroup, TextField } from '@mui/material'
import { useTranslations } from 'next-intl'
import DetailedGESFields from './DetailedGESForm'
import EmissionPostForm from './EmissionPostForm'

interface Props {
  form: UseFormReturn<CreateEmissionCommand>
}

const DetailedGES = ({ form }: Props) => {
  const t = useTranslations('emissions.create')
  const [detailedGES, setDetailedGES] = useState(false)
  const [multipleEmissions, setMultiple] = useState(true)
  const [postsCount, setPosts] = useState(1)

  const emissionValues = form.watch(['ch4b', 'ch4f', 'co2b', 'co2f', 'n2o', 'sf6', 'hfc', 'pfc', 'otherGES'])
  const emissionPostsValues = form.watch('posts')
  const totalCo2 = form.watch('totalCo2')

  useEffect(() => {
    if (detailedGES) {
      const newTotal = emissionValues.reduce((acc: number, current) => {
        const accountableValues = current?.filter((_, i) => (multipleEmissions ? i < postsCount : i === 0)) || []
        const totalCurrent = accountableValues.reduce((acc: number, current: number) => acc + current, 0)
        return acc + (totalCurrent || 0)
      }, 0)
      if (totalCo2 !== newTotal) {
        form.setValue('totalCo2', newTotal)
      }
    } else {
      const newTotal = (emissionPostsValues || [])
        .filter((_, i) => i < postsCount)
        .reduce((acc: number, current) => acc + (current.totalCo2 || 0), 0)
      if (totalCo2 !== newTotal) {
        form.setValue('totalCo2', newTotal)
      }
    }
  }, [totalCo2, emissionValues, emissionPostsValues, detailedGES])

  const updateEmissionPostsCount = (count: number) => {
    setPosts(count)
    if (count > (form.getValues('co2f') || []).length) {
      form.setValue('ch4b', [...(form.getValues('ch4b') || []), 0])
      form.setValue('ch4f', [...(form.getValues('ch4f') || []), 0])
      form.setValue('co2b', [...(form.getValues('co2b') || []), 0])
      form.setValue('co2f', [...(form.getValues('co2f') || []), 0])
      form.setValue('n2o', [...(form.getValues('n2o') || []), 0])
      form.setValue('sf6', [...(form.getValues('sf6') || []), 0])
      form.setValue('hfc', [...(form.getValues('hfc') || []), 0])
      form.setValue('pfc', [...(form.getValues('pfc') || []), 0])
      form.setValue('otherGES', [...(form.getValues('otherGES') || []), 0])
      form.setValue('posts', (form.getValues('posts') || []).concat([{ name: '', totalCo2: 0 }]))
    }
  }

  return (
    <>
      <div className={`${styles.questions} flex`}>
        <div className="grow">
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
        <div className="grow">
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
        <div className="grow">
          {multipleEmissions && (
            <>
              <FormLabel id={`sub-posts-count-label`} component="legend">
                {t('subPostsCount')}
              </FormLabel>
              <TextField
                type="number"
                slotProps={{ htmlInput: { min: 1 } }}
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
            <EmissionPostForm key={index} detailedGES={detailedGES} form={form} index={index} totalCo2={totalCo2} />
          ))}
        </>
      ) : (
        <DetailedGESFields detailedGES={detailedGES} control={form.control} index={0} />
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
