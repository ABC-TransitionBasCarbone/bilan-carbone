'use client'

import LoadingButton from '@/components/base/LoadingButton'
import { FormSelect } from '@/components/form/Select'
import { FormTextField } from '@/components/form/TextField'
import { CreateEmissionFactorCommand } from '@/services/serverFunctions/emissionFactor.command'
import { MenuItem } from '@mui/material'
import { Unit } from '@prisma/client'
import { useTranslations } from 'next-intl'
import { useMemo } from 'react'
import { UseFormReturn } from 'react-hook-form'
import DetailedGES from './DetailedGES'
import Posts from './Posts'

interface Props {
  form: UseFormReturn<CreateEmissionFactorCommand>
  error: string
  t: (key: string) => string
  hasParts: boolean
  setHasParts: (hasParts: boolean) => void
  partsCount: number
  setPartsCount: (count: number) => void
}

const EmissionFactorForm = ({ form, error, t, hasParts, setHasParts, partsCount, setPartsCount }: Props) => {
  const tUnit = useTranslations('units')

  const units = useMemo(() => Object.values(Unit).sort((a, b) => tUnit(a).localeCompare(tUnit(b))), [tUnit])

  return (
    <>
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
      <DetailedGES
        form={form}
        hasParts={hasParts}
        setHasParts={setHasParts}
        partsCount={partsCount}
        setPartsCount={setPartsCount}
      />
      <Posts form={form} />
      <FormTextField control={form.control} translation={t} name="comment" label={t('comment')} multiline rows={2} />
      <LoadingButton type="submit" loading={form.formState.isSubmitting} data-testid="new-emission-create-button">
        {t('create')}
      </LoadingButton>
      {error && <p>{error}</p>}
    </>
  )
}

export default EmissionFactorForm
