'use client'

import { LoginCommand, LoginCommandValidation } from '@/services/serverFunctions/user.command'
import { zodResolver } from '@hookform/resolvers/zod'
import { FormControl } from '@mui/material'
import classNames from 'classnames'
import { signIn } from 'next-auth/react'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { FormEvent, useState } from 'react'
import { useForm } from 'react-hook-form'
import Form from '../base/Form'
import LoadingButton from '../base/LoadingButton'
import { FormTextField } from '../form/TextField'
import authStyles from './Auth.module.css'
import styles from './LoginForm.module.css'

const LoginForm = () => {
  const t = useTranslations('login.form')
  const router = useRouter()
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const form = useForm<LoginCommand>({
    resolver: zodResolver(LoginCommandValidation),
    mode: 'onBlur',
    reValidateMode: 'onChange',
    defaultValues: {
      email: '',
      password: '',
    },
  })

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    const result = await signIn('credentials', {
      ...form.getValues(),
      redirect: false,
    })

    if (result?.error) {
      setSubmitting(false)
      setError(t('error'))
    } else {
      router.push('/')
    }
  }

  return (
    <Form onSubmit={onSubmit} className={classNames(authStyles.form, authStyles.medium)}>
      <FormControl>
        <FormTextField
          className="grow"
          control={form.control}
          name="email"
          label={t('email')}
          translation={t}
          data-testid="input-email"
        />
        <FormTextField
          className={classNames(authStyles.input, 'grow')}
          control={form.control}
          name="password"
          label={t('password')}
          translation={t}
          data-testid="input-password"
          type="password"
          helperText={error}
          error={!!error}
        />
        <Link
          data-testid="reset-password-link"
          className={styles.link}
          href={`/reset-password?email=${form.getValues().email}`}
          prefetch={false}
        >
          {t('forgotPassword')}
        </Link>
        <div>
          <LoadingButton data-testid="login-button" type="submit" loading={submitting} fullWidth>
            {t('login')}
          </LoadingButton>
        </div>
        <div className={styles.activation}>
          {t('firstConnection')}
          <Link data-testid="activation-button" className="ml-2" href="/activation" prefetch={false}>
            {t('activate')}
          </Link>
        </div>
      </FormControl>
    </Form>
  )
}

export default LoginForm
