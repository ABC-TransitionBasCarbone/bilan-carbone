'use client'

import { Select } from '@/components/base/Select'
import GlossaryIconModal from '@/components/modals/GlossaryIconModal'
import { EmissionFactorCommand } from '@/services/serverFunctions/emissionFactor.command'
import { FormControl, FormHelperText, MenuItem } from '@mui/material'
import { EmissionFactorBase, SubPost } from '@prisma/client'
import { useTranslations } from 'next-intl'
import { useEffect, useMemo } from 'react'
import { Control, Controller, UseFormReturn, UseFormSetValue } from 'react-hook-form'
import styles from './Base.module.css'

const GlossaryModal = () => {
  const t = useTranslations('emissionFactors.create.baseModal')
  return (
    <div className="flex-col gapped">
      <p>{t('description')}</p>
      <ul className={styles.list}>
        <li>{t('location')}</li>
        <li>{t('market')}</li>
      </ul>
      <p>{t('conclusion')}</p>
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

  const control = form.control as Control<EmissionFactorCommand>
  const setValue = form.setValue as UseFormSetValue<EmissionFactorCommand>

  const subPostsValues = (form as UseFormReturn<EmissionFactorCommand>).watch('subPosts')

  const hasElectricity = useMemo(() => {
    const subPosts = Object.values(subPostsValues || {}).flat()
    return subPosts.includes(SubPost.Electricite)
  }, [subPostsValues])

  useEffect(() => {
    if (!hasElectricity) {
      setValue('base', null)
    }
  }, [hasElectricity, setValue])

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
