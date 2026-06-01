'use client'

import { customRich } from '@/i18n/customRich'
import { getEnvVarClient } from '@/lib/environmentClient'
import { getEnvRoute } from '@/services/email/utils'
import { LoginCommand, LoginCommandValidation } from '@/services/serverFunctions/user.command'
import { Environment } from '@abc-transitionbascarbone/db-common/enums'
import { zodResolver } from '@hookform/resolvers/zod'
import Visibility from '@mui/icons-material/Visibility'
import VisibilityOff from '@mui/icons-material/VisibilityOff'
import { FormControl, IconButton, InputAdornment } from '@mui/material'
import classNames from 'classnames'
import { signIn } from 'next-auth/react'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import Form from '../base/Form'
import LoadingButton from '../base/LoadingButton'
import { FormTextField } from '../form/TextField'
import authStyles from './Auth.module.css'
import styles from './LoginForm.module.css'

interface Props {
  environment?: Environment
}

const LoginForm = ({ environment = Environment.BC }: Props) => {
  'use memo'

  const support = getEnvVarClient('SUPPORT_EMAIL', environment)
  const t = useTranslations('login.form')
  const router = useRouter()
  const [submitting, setSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  const { getValues, control, handleSubmit } = useForm<LoginCommand>({
    resolver: zodResolver(LoginCommandValidation),
    mode: 'onBlur',
    reValidateMode: 'onChange',
    defaultValues: { email: '', password: '' },
  })

  const email = useWatch({ control, name: 'email', defaultValue: '' })

  const onSubmit = async () => {
    setErrorMessage('')
    setSubmitting(true)

    const values = getValues()
    const result = await signIn('credentials', { ...values, email: values.email.toLowerCase(), redirect: false })

    if (result?.error) {
      setSubmitting(false)
      setErrorMessage('error')
    } else {
      router.push('/?fromLogin')
    }
  }
  const resetLink = getEnvRoute(`reset-password?email=${email}`, environment)
  const activationLink = getEnvRoute(
    environment === Environment.BC ? `activation?email=${email}` : `register?email=${email}`,
    environment,
  )

  return (
    <Form onSubmit={handleSubmit(onSubmit)} className="grow justify-center">
      <FormControl className={authStyles.form}>
        <FormTextField
          className="grow"
          control={control}
          name="email"
          label={t('email')}
          placeholder={t('emailPlaceholder')}
          data-testid="input-email"
          trim
        />
        <FormTextField
          className={classNames(authStyles.input, 'grow')}
          control={control}
          name="password"
          label={t('password')}
          placeholder={t('passwordPlaceholder')}
          endAdornment={
            <InputAdornment position="end">
              <IconButton
                aria-label={showPassword ? t('hidePassword') : t('showPassword')}
                onClick={() => setShowPassword((show) => !show)}
              >
                {showPassword ? <VisibilityOff /> : <Visibility />}
              </IconButton>
            </InputAdornment>
          }
          iconPosition="after"
          data-testid="input-password"
          type={showPassword ? 'text' : 'password'}
          error={!!errorMessage}
        />
        <Link data-testid="reset-password-link" className={styles.link} href={resetLink} prefetch={false}>
          {t('forgotPassword')}
        </Link>
        <LoadingButton data-testid="login-button" type="submit" loading={submitting} fullWidth>
          {t('login')}
        </LoadingButton>
        {errorMessage && (
          <p className="error">
            {customRich(t, errorMessage, {
              link: (children) => <Link href={`mailto:${support}`}>{children}</Link>,
            })}
          </p>
        )}
        <div className={authStyles.bottomLink}>
          {t('firstConnection')}
          <Link data-testid="activation-button" className="ml-2" href={activationLink} prefetch={false}>
            {t('activate')}
          </Link>
        </div>
      </FormControl>
    </Form>
  )
}

export default LoginForm
