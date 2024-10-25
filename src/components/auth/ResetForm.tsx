'use client'

import { useTranslations } from 'next-intl'
import React, { FormEvent, useEffect, useState } from 'react'
import authStyles from './Auth.module.css'
import Input from '../base/Input'
import Button from '../base/Button'
import { signOut } from 'next-auth/react'
import { User } from 'next-auth'

interface Props {
  user?: User
  reset: (email: string, password: string) => Promise<void>
}

const ResetForm = ({ user, reset }: Props) => {
  useEffect(() => {
    if (user) {
      signOut({ redirect: false })
    }
  }, [user])

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
