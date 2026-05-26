'use client'

import { Select } from '@/components/base/Select'
import GlossaryIconModal from '@/components/modals/GlossaryIconModal'
import { customRich } from '@/i18n/customRich'
import { EmissionFactorCommand } from '@/services/serverFunctions/emissionFactor.command'
import { EmissionFactorBase, SubPost } from '@abc-transitionbascarbone/db-common/enums'
import { FormControl, FormHelperText, MenuItem } from '@mui/material'
import { useTranslations } from 'next-intl'
import { useEffect, useMemo } from 'react'
import { Controller, UseFormReturn } from 'react-hook-form'
import styles from './Base.module.css'

const GlossaryModal = () => {
  const t = useTranslations('emissionFactors.create.baseModal')
  return (
    <div className="flex-col gapped">
      <p>{customRich(t, 'description')}</p>
      <ul className={styles.list}>
        <li>{customRich(t, 'location')}</li>
        <li>{customRich(t, 'market')}</li>
      </ul>
      <p>{customRich(t, 'conclusion')}</p>
    </div>
  )
}

interface Props<T extends EmissionFactorCommand> {
  form: UseFormReturn<T>
}

const Base = <T extends EmissionFactorCommand>({ form }: Props<T>) => {
  const t = useTranslations('emissionFactors.create')
  const tValidation = useTranslations('validation')
  const tBase = useTranslations('emissionFactors.base')

  const castedForm = form as UseFormReturn<EmissionFactorCommand>
  const control = castedForm.control
  const setValue = castedForm.setValue
  const subPostsValues = castedForm.watch('subPosts')

  const hasElectricity = useMemo(() => {
    const subPosts = Object.values(subPostsValues || {}).flat()
    return subPosts.includes(SubPost.Electricite)
  }, [subPostsValues])

  useEffect(() => {
    if (!hasElectricity) {
      setValue('base', null)
    } else if (!castedForm.getValues('base')) {
      setValue('base', EmissionFactorBase.LocationBased)
    }
  }, [hasElectricity, setValue, castedForm])

  return (
    hasElectricity && (
      <>
        <Controller
          name="base"
          control={control}
          render={({ fieldState: { error }, field: { value } }) => (
            <FormControl error={!!error}>
              <Select
                name="base"
                onChange={(e) => setValue('base', e.target.value as EmissionFactorBase)}
                value={value}
                data-testid="emission-factor-base"
                label={`${t('base')} *`}
                fullWidth
                icon={
                  <GlossaryIconModal
                    title="title"
                    iconLabel="title"
                    label="emission-factor-base"
                    tModal="emissionFactors.create.baseModal"
                  >
                    <GlossaryModal />
                  </GlossaryIconModal>
                }
                iconPosition="after"
              >
                {Object.values(EmissionFactorBase).map((base) => (
                  <MenuItem key={base} value={base}>
                    {tBase(base)}
                  </MenuItem>
                ))}
              </Select>
              {error && error.message && (
                <FormHelperText className="error">{tValidation(error.message)}</FormHelperText>
              )}
            </FormControl>
          )}
        />
      </>
    )
  )
}

export default Base
