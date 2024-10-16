'use client'

import { signIn } from 'next-auth/react'
import { useTranslations } from 'next-intl'
import React, { FormEvent, useState } from 'react'
import styles from './LoginForm.module.css'
import authStyles from './Auth.module.css'
import Input from '../base/Input'
import Button from '../base/Button'
import Link from 'next/link'

const LoginForm = () => {
  const t = useTranslations('login.form')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    await signIn('credentials', {
      email,
      password,
    })
  }

  return (
    <form onSubmit={onSubmit} className={authStyles.form}>
      <Input
        data-testid="input-email"
        className={authStyles.input}
        required
        placeholder={t('email')}
        type="email"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
      />
      <Input
        data-testid="input-password"
        className={authStyles.input}
        required
        placeholder={t('password')}
        value={password}
        type="password"
        onChange={(event) => setPassword(event.target.value)}
      />
      <Link data-testid="reset-password-link" className={styles.link} href={`/reset-password?email=${email}`}>
        {t('forgot-password')}
      </Link>
      <Button data-testid="login-button" type="submit">
        {t('login')}
      </Button>
    </form>
  )
}

export default LoginForm
