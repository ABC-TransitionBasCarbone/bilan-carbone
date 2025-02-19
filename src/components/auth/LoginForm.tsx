'use client'

import { LoginCommand, LoginCommandValidation } from '@/services/serverFunctions/user.command'
import { zodResolver } from '@hookform/resolvers/zod'
import Visibility from '@mui/icons-material/Visibility'
import VisibilityOff from '@mui/icons-material/VisibilityOff'
import { FormControl, IconButton, InputAdornment } from '@mui/material'
import classNames from 'classnames'
import { signIn } from 'next-auth/react'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { FormEvent, useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import Form from '../base/Form'
import LoadingButton from '../base/LoadingButton'
import { FormTextField } from '../form/TextField'
import authStyles from './Auth.module.css'
import styles from './LoginForm.module.css'

const contactMail = process.env.NEXT_PUBLIC_ABC_SUPPORT_MAIL

const LoginForm = () => {
  const t = useTranslations('login.form')
  const router = useRouter()
  const [submitting, setSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [email, setEmail] = useState('')

  const { getValues, control, watch } = useForm<LoginCommand>({
    resolver: zodResolver(LoginCommandValidation),
    mode: 'onBlur',
    reValidateMode: 'onChange',
    defaultValues: {
      email: '',
      password: '',
    },
  })

  useEffect(() => {
    const { unsubscribe } = watch((values) => setEmail(values.email ?? ''))

    return () => unsubscribe()
  }, [watch])

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setErrorMessage('')
    setSubmitting(true)

    if (!getValues().email || !getValues().password) {
      setErrorMessage('emailAndPasswordRequired')
      setSubmitting(false)
      return
    }

    const result = await signIn('credentials', {
      ...getValues(),
      redirect: false,
    })

    if (result?.error) {
      setSubmitting(false)
      setErrorMessage('error')
    } else {
      router.push('/')
    }
  }

  return (
    <Form onSubmit={onSubmit} className={classNames(authStyles.medium)}>
      <FormControl className={classNames(authStyles.form)}>
        <FormTextField
          className="grow"
          control={control}
          name="email"
          label={t('email')}
          placeholder={t('emailPlaceholder')}
          translation={t}
          data-testid="input-email"
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
          helperText={errorMessage}
          error={!!errorMessage}
        />
        <Link
          data-testid="reset-password-link"
          className={styles.link}
          href={`/reset-password?email=${email}`}
          prefetch={false}
        >
          {t('forgotPassword')}
        </Link>
        <div>
          <LoadingButton data-testid="login-button" type="submit" loading={submitting} fullWidth>
            {t('login')}
          </LoadingButton>
        </div>
        {errorMessage && (
          <p className="error" data-testid="activation-form-error">
            {t.rich(errorMessage, {
              link: (children) => <Link href={`mailto:${contactMail}`}>{children}</Link>,
            })}
          </p>
        )}
        <div className={styles.activation}>
          {t('firstConnection')}
          <Link data-testid="activation-button" className="ml-2" href={`/activation?email=${email}`} prefetch={false}>
            {t('activate')}
          </Link>
        </div>
      </FormControl>
    </Form>
  )
}

export default LoginForm
