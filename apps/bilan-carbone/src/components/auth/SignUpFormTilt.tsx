'use client'

import { signUpWithSiretOrCNC } from '@/services/serverFunctions/user'
import { SignUpTiltCommand, SignUpTiltCommandValidation } from '@/services/serverFunctions/user.command'
import Form from '@abc-transitionbascarbone/components/src/base/Form'
import LoadingButton from '@abc-transitionbascarbone/components/src/base/LoadingButton'
import { FormTextField } from '@abc-transitionbascarbone/components/src/form/TextField'
import { Environment } from '@abc-transitionbascarbone/db-common/enums'
import { getEnvRoute } from '@abc-transitionbascarbone/services/email/utils'
import { customRich } from '@abc-transitionbascarbone/utils/customRich'
import { getEnvVarClient } from '@abc-transitionbascarbone/utils/environmentClient'
import { zodResolver } from '@hookform/resolvers/zod'
import { FormControl } from '@mui/material'
import classNames from 'classnames'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import authStyles from './Auth.module.css'

const SignUpFormTilt = () => {
  const contactMail = getEnvVarClient('SUPPORT_EMAIL', Environment.TILT)
  const t = useTranslations()
  const tForm = useTranslations('login.form')
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState('')
  const [success, setSuccess] = useState(false)

  const searchParams = useSearchParams()

  const { control, getValues, setValue, handleSubmit } = useForm<SignUpTiltCommand>({
    resolver: zodResolver(SignUpTiltCommandValidation),
    mode: 'onBlur',
    reValidateMode: 'onChange',
    defaultValues: {
      email: searchParams.get('email') ?? '',
    },
  })

  useEffect(() => {
    const email = searchParams.get('email')
    if (email) {
      setValue('email', email)
    }
  }, [searchParams, setValue])

  const onSubmit = async () => {
    setMessage('')
    setSubmitting(true)

    const activation = await signUpWithSiretOrCNC(getValues().email, getValues().siret, Environment.TILT)
    setSubmitting(false)

    if (activation.success) {
      setSuccess(true)
      setMessage(activation.data)
    } else {
      setSuccess(false)
      setMessage(activation.errorMessage)
    }
  }

  return (
    <Form onSubmit={handleSubmit(onSubmit)} className="grow justify-center">
      <FormControl className={authStyles.form}>
        <FormTextField
          control={control}
          name="email"
          className={authStyles.input}
          label={t('signup.email')}
          placeholder={t('signup.emailPlaceholder')}
          data-testid="activation-email"
        />
        <FormTextField
          control={control}
          name="siret"
          className={authStyles.input}
          label={t('signup.siret')}
          placeholder={t('signup.siretPlaceholder')}
          data-testid="activation-siret"
        />
        <LoadingButton data-testid="activation-button" type="submit" loading={submitting} variant="contained" fullWidth>
          {t('signup.validate')}
        </LoadingButton>
        {message && (
          <p className={classNames(!success ? 'error' : '')} data-testid="activation-form-message">
            {customRich(
              t,
              `signup.${message}`,
              {
                support: (children) => <Link href={`mailto:${contactMail}`}>{children}</Link>,
              },
              Environment.TILT,
            )}
          </p>
        )}
        <div className={authStyles.bottomLink}>
          {tForm('alreadyRegistered')}
          <Link className="ml-2" href={getEnvRoute('login', Environment.TILT)} prefetch={false}>
            {tForm('login')}
          </Link>
        </div>
      </FormControl>
    </Form>
  )
}

export default SignUpFormTilt
