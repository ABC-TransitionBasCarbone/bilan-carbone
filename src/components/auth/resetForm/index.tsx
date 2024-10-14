'use client'

import { useTranslations } from 'next-intl'
import React, { FormEvent, useState } from 'react'
import authStyles from '../styles.module.css'
import Input from '../../input'
import Button from '../../button'

const ResetForm = ({ reset }: { reset: (email: string, password: string) => Promise<void> }) => {
  const t = useTranslations('login.form')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    await reset(email, password)
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
      <Button type="submit" data-testid="reset-button">
        {t('reset')}
      </Button>
    </form>
  )
}

export default ResetForm
