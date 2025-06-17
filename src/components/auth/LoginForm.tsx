'use client'

import { getEnvRoute } from '@/services/email/utils'
import { LoginCommand, LoginCommandValidation } from '@/services/serverFunctions/user.command'
import { zodResolver } from '@hookform/resolvers/zod'
import Visibility from '@mui/icons-material/Visibility'
import VisibilityOff from '@mui/icons-material/VisibilityOff'
import { FormControl, IconButton, InputAdornment } from '@mui/material'
import { Environment } from '@prisma/client'
import classNames from 'classnames'
import { signIn } from 'next-auth/react'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import Form from '../base/Form'
import LoadingButton from '../base/LoadingButton'
import { FormTextField } from '../form/TextField'
import authStyles from './Auth.module.css'
import styles from './LoginForm.module.css'

const contactMail = process.env.NEXT_PUBLIC_ABC_SUPPORT_MAIL

interface Props {
  environment?: Environment
}

const LoginForm = ({ environment = Environment.BC }: Props) => {
  const t = useTranslations('login.form')
  const router = useRouter()
  const [submitting, setSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [email, setEmail] = useState('')

  const { getValues, control, watch, handleSubmit } = useForm<LoginCommand>({
    resolver: zodResolver(LoginCommandValidation),
    mode: 'onBlur',
    reValidateMode: 'onChange',
    defaultValues: { email: '', password: '' },
  })

  useEffect(() => {
    setEmail(getValues('email') ?? '')

    const subscription = watch((values) => {
      if (values.email !== email) {
        setEmail(values.email ?? '')
      }
    })

    return () => subscription.unsubscribe()
  }, [watch])

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
  const resetLink = useMemo(() => getEnvRoute(`reset-password?email=${email}`, environment), [email])
  const activationLink = useMemo(() => getEnvRoute(`activation?email=${email}`, environment), [email])

  return (
    <Form onSubmit={handleSubmit(onSubmit)} className="grow justify-center">
      <FormControl className={authStyles.form}>
        <FormTextField
          className="grow"
          control={control}
          name="email"
          label={t('email')}
          placeholder={t('emailPlaceholder')}
          translation={t}
          data-testid="input-email"
          trim
        />
        <FormTextField
          className={classNames(authStyles.input, 'grow')}
          control={control}
          name="password"
          label={t('password')}
          placeholder={t('passwordPlaceholder')}
          translation={t}
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
            {t.rich(errorMessage, {
              link: (children) => <Link href={`mailto:${contactMail}`}>{children}</Link>,
            })}
          </p>
        )}
        <div className={styles.activation}>
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
