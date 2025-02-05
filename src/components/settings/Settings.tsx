'use client'

import { updateUserSettings } from '@/services/serverFunctions/user'
import { EditSettingsCommand, EditSettingsCommandValidation } from '@/services/serverFunctions/user.command'
import { zodResolver } from '@hookform/resolvers/zod'
import { FormControl, FormControlLabel, FormLabel, Switch } from '@mui/material'
import { UserApplicationSettings } from '@prisma/client'
import { useTranslations } from 'next-intl'
import { useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import Form from '../base/Form'
import LoadingButton from '../base/LoadingButton'

interface Props {
  userSettings: UserApplicationSettings
}

const Settings = ({ userSettings }: Props) => {
  const t = useTranslations('settings')
  const [error, setError] = useState('')

  const form = useForm<EditSettingsCommand>({
    resolver: zodResolver(EditSettingsCommandValidation),
    mode: 'onBlur',
    reValidateMode: 'onChange',
    defaultValues: {
      validatedEmissionSourcesOnly: userSettings.validatedEmissionSourcesOnly,
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
