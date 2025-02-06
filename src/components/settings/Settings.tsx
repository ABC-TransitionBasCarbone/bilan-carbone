'use client'

import { updateUserSettings } from '@/services/serverFunctions/user'
import { EditSettingsCommand, EditSettingsCommandValidation } from '@/services/serverFunctions/user.command'
import { zodResolver } from '@hookform/resolvers/zod'
import { FormControl, FormControlLabel, FormLabel, MenuItem, Switch } from '@mui/material'
import { SiteCAUnit, UserApplicationSettings } from '@prisma/client'
import { useTranslations } from 'next-intl'
import { useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import Form from '../base/Form'
import LoadingButton from '../base/LoadingButton'
import { FormSelect } from '../form/Select'
import styles from './Settings.module.css'

interface Props {
  userSettings: UserApplicationSettings
}

const Settings = ({ userSettings }: Props) => {
  const t = useTranslations('settings')
  const tUnit = useTranslations('settings.caUnit')
  const [error, setError] = useState('')

  const form = useForm<EditSettingsCommand>({
    resolver: zodResolver(EditSettingsCommandValidation),
    mode: 'onBlur',
    reValidateMode: 'onChange',
    defaultValues: {
      validatedEmissionSourcesOnly: userSettings.validatedEmissionSourcesOnly,
      caUnit: userSettings.caUnit,
    },
  })

  const onSubmit = async () => {
    form.clearErrors()
    const result = await updateUserSettings(form.getValues())
    if (result) {
      setError(result)
    }
    form.reset(form.getValues())
  }

  return (
    <>
      <div className="mb1">
        <Form onSubmit={form.handleSubmit(onSubmit)}>
          <FormControl>
            <FormLabel>{t('validatedEmissionSourcesOnly')}</FormLabel>
            <Controller
              name="validatedEmissionSourcesOnly"
              control={form.control}
              render={({ field }) => (
                <FormControlLabel
                  control={
                    <Switch
                      {...field}
                      checked={field.value}
                      onChange={(event) => field.onChange(event.target.checked)}
                    />
                  }
                  label={t(field.value ? 'yes' : 'no')}
                />
              )}
            />
          </FormControl>

          <FormSelect
            className={styles.selector}
            control={form.control}
            translation={t}
            name="caUnit"
            label={tUnit('label')}
          >
            {Object.keys(SiteCAUnit).map((scale) => (
              <MenuItem key={scale} value={scale}>
                {tUnit(scale)}
              </MenuItem>
            ))}
          </FormSelect>
          <LoadingButton
            type="submit"
            disabled={!form.formState.isDirty}
            loading={form.formState.isSubmitting}
            data-testid="update-settings"
          >
            {t('validate')}
          </LoadingButton>
        </Form>
      </div>
      {error && <p className="error">{t(error)}</p>}
    </>
  )
}

export default Settings
