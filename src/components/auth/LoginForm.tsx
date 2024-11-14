'use client'

import { signIn } from 'next-auth/react'
import { useTranslations } from 'next-intl'
import React, { FormEvent, useState } from 'react'
import styles from './LoginForm.module.css'
import authStyles from './Auth.module.css'
import Button from '../base/Button'
import Link from 'next/link'
import { TextField } from '@mui/material'
import { useRouter } from 'next/navigation'

const LoginForm = () => {
  const t = useTranslations('login.form')
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')
    const result = await signIn('credentials', {
      email,
      password,
      redirect: false,
    })

    if (result?.error) {
      setError(t('error'))
    } else {
      router.push('/')
    }
  }

  return (
    <form onSubmit={onSubmit} className={authStyles.form}>
      <TextField
        data-testid="input-email"
        className={authStyles.input}
        required
        label={t('email')}
        type="email"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
      />
      <TextField
        data-testid="input-password"
        className={authStyles.input}
        required
        label={t('password')}
        value={password}
        type="password"
        onChange={(event) => setPassword(event.target.value)}
        helperText={error}
        error={!!error}
      />
      <Link
        data-testid="reset-password-link"
        className={styles.link}
        href={`/reset-password?email=${email}`}
        prefetch={false}
      >
        {t('forgot-password')}
      </Link>
      <Button data-testid="login-button" type="submit">
        {t('login')}
      </Button>
    </form>
  )
}

export default LoginForm
