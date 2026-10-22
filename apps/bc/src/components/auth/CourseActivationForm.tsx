'use client'

import { activateEmailForCourse, checkCourseActivation } from '@/services/serverFunctions/user'
import ResetFormCommon from '@abc-transitionbascarbone/common/components/auth/ResetFormCommon'
import { EmailCommandValidation } from '@abc-transitionbascarbone/common/components/auth/user.command'
import Form from '@abc-transitionbascarbone/common/components/base/Form'
import LoadingButton from '@abc-transitionbascarbone/common/components/base/LoadingButton'
import { FormTextField } from '@abc-transitionbascarbone/common/components/form/TextField'
import { useServerFunction } from '@abc-transitionbascarbone/common/components/hooks/useServerFunction'
import { Environment } from '@abc-transitionbascarbone/common/db/enums'
import { customRich } from '@abc-transitionbascarbone/common/utils/customRich'
import { getEnvVarClient } from '@abc-transitionbascarbone/common/utils/environmentClient'
import { CourseEnvironment, getEnvRoute } from '@abc-transitionbascarbone/common/utils/environments'
import { zodResolver } from '@hookform/resolvers/zod'
import { Checkbox, FormControl, FormControlLabel, FormHelperText } from '@mui/material'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { z } from 'zod'
import authStyles from './Auth.module.css'

interface Props {
  environment?: CourseEnvironment
}

const CourseActivationForm = ({ environment = Environment.COURSE_BC }: Props) => {
  const contactMail = getEnvVarClient('SUPPORT_EMAIL', environment)
  const t = useTranslations('activation')
  const tLogin = useTranslations('login.form')
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState('')
  const [activatedCredentials, setActivatedCredentials] = useState<{
    email: string
    sessionCode: string
  } | null>(null)
  const { callServerFunction } = useServerFunction()
  const router = useRouter()

  const searchParams = useSearchParams()
  const validation = EmailCommandValidation.extend({
    sessionCode: z.string().trim().min(1, t('validation.sessionCode')),
    consent: z.boolean().refine((accepted) => accepted, t('validation.consent')),
  })

  const { control, setValue, handleSubmit } = useForm({
    resolver: zodResolver(validation),
    mode: 'onBlur',
    reValidateMode: 'onChange',
    defaultValues: {
      email: searchParams.get('email') ?? '',
      sessionCode: '',
      consent: false,
    },
  })

  useEffect(() => {
    const email = searchParams.get('email')
    if (email) {
      setValue('email', email)
    }
  }, [searchParams, setValue])

  const onSubmit = async (values: z.output<typeof validation>) => {
    setMessage('')
    setSubmitting(true)

    const courseValidation = await checkCourseActivation(values.email, values.sessionCode, environment)
    setSubmitting(false)

    if (courseValidation.success) {
      setActivatedCredentials({
        email: values.email,
        sessionCode: values.sessionCode,
      })
    } else {
      setMessage(courseValidation.errorMessage)
    }
  }

  const initPassword = async (password: string) => {
    if (!activatedCredentials) {
      return
    }

    await callServerFunction(
      () => activateEmailForCourse(activatedCredentials.email, activatedCredentials.sessionCode, password, environment),
      {
        getSuccessMessage: () => tLogin('validated'),
        getErrorMessage: () => tLogin('resetError'),
        onSuccess: () => {
          setSubmitting(false)
          router.push(getEnvRoute('login', environment))
        },
        onError: () => {
          setSubmitting(false)
        },
      },
    )
  }

  if (activatedCredentials) {
    return <ResetFormCommon resetPassword={initPassword} submitting={submitting} setSubmitting={setSubmitting} />
  }

  return (
    <Form onSubmit={handleSubmit(onSubmit)} className="grow justify-center">
      <FormControl className={authStyles.form}>
        <p>{t('description')}</p>
        <FormTextField
          control={control}
          name="email"
          className={authStyles.input}
          label={t('email')}
          placeholder={t('emailPlaceholder')}
          data-testid="activation-email"
          trim
        />
        <FormTextField
          control={control}
          name="sessionCode"
          className={authStyles.input}
          label={t('sessionCode')}
          placeholder={t('sessionCodePlaceholder')}
          data-testid="activation-session-code"
          trim
        />
        <Controller
          control={control}
          name="consent"
          render={({ field, fieldState: { error } }) => (
            <FormControl error={!!error}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={field.value}
                    inputRef={field.ref}
                    name={field.name}
                    onBlur={field.onBlur}
                    onChange={(_, checked) => field.onChange(checked)}
                    data-testid="activation-consent"
                  />
                }
                label={t('consent')}
              />
              {error?.message && <FormHelperText>{error.message}</FormHelperText>}
            </FormControl>
          )}
        />
        <LoadingButton data-testid="activation-button" type="submit" loading={submitting} fullWidth>
          {t('validate')}
        </LoadingButton>
        {message && (
          <p className="error" data-testid="activation-form-message">
            {customRich(
              t,
              message,
              {
                support: (children) => <Link href={`mailto:${contactMail}`}>{children}</Link>,
              },
              environment,
            )}
          </p>
        )}
      </FormControl>
    </Form>
  )
}

export default CourseActivationForm
