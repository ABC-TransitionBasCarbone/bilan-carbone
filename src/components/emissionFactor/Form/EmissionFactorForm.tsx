'use client'

import LinkButton from '@/components/base/LinkButton'
import LoadingButton from '@/components/base/LoadingButton'
import { FormSelect } from '@/components/form/Select'
import { FormTextField } from '@/components/form/TextField'
import { EmissionFactorCommand } from '@/services/serverFunctions/emissionFactor.command'
import { MenuItem } from '@mui/material'
import { Unit } from '@prisma/client'
import classNames from 'classnames'
import { useTranslations } from 'next-intl'
import { useMemo } from 'react'
import { Control, UseFormReturn } from 'react-hook-form'
import DetailedGES from './DetailedGES'
import MultiplePosts from './MultiplePosts'

interface Props<T extends EmissionFactorCommand> {
  form: UseFormReturn<T>
  detailedGES?: boolean
  error: string
  hasParts: boolean
  setHasParts: (hasParts: boolean) => void
  partsCount: number
  setPartsCount: (count: number) => void
  button: 'create' | 'update'
}

const EmissionFactorForm = <T extends EmissionFactorCommand>({
  form,
  detailedGES,
  error,
  hasParts,
  setHasParts,
  partsCount,
  setPartsCount,
  button,
}: Props<T>) => {
  const t = useTranslations('emissionFactors.create')
  const tUnit = useTranslations('units')
  const units = useMemo(() => Object.values(Unit).sort((a, b) => tUnit(a).localeCompare(tUnit(b))), [tUnit])

  const control = form.control as Control<EmissionFactorCommand>

  return (
    <>
      <FormTextField
        data-testid="emission-factor-name"
        control={control}
        translation={t}
        name="name"
        label={t('name')}
        placeholder={t('namePlaceholder')}
      />
      <FormTextField control={control} translation={t} name="attribute" label={t('attribute')} />
      <FormTextField
        data-testid="emission-factor-source"
        control={control}
        translation={t}
        name="source"
        label={t('source')}
      />
      <FormSelect data-testid="emission-factor-unit" control={control} translation={t} label={t('unit')} name="unit">
        {units.map((unit) => (
          <MenuItem key={unit} value={unit}>
            {tUnit(unit)}
          </MenuItem>
        ))}
      </FormSelect>
      <DetailedGES
        form={form}
        initialDetailedGES={detailedGES}
        hasParts={hasParts}
        setHasParts={setHasParts}
        partsCount={partsCount}
        setPartsCount={setPartsCount}
      />
      <MultiplePosts form={form} />
      <FormTextField control={control} translation={t} name="comment" label={t('comment')} multiline rows={2} />
      <div className={classNames({ ['justify-between']: button === 'update' })}>
        {button === 'update' && (
          <LinkButton data-testid="emission-factor-cancel-update" href="/facteurs-d-emission">
            {t('cancel')}
          </LinkButton>
        )}
        <LoadingButton type="submit" loading={form.formState.isSubmitting} data-testid="emission-factor-valid-button">
          {t(button)}
        </LoadingButton>
      </div>
      {error && <p>{error}</p>}
    </>
  )
}

export default EmissionFactorForm
