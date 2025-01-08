'use client'

import { checkToken, reset } from '@/services/serverFunctions/auth'
import { TextField } from '@mui/material'
import { User } from 'next-auth'
import { signOut } from 'next-auth/react'
import { useTranslations } from 'next-intl'
import { FormEvent, useEffect, useState } from 'react'
import Button from '../base/Button'
import ResetAlreadyUsed from '../pages/ResetAlreadyUsed'
import authStyles from './Auth.module.css'

interface Props {
  user?: User
  token: string
}

const ResetForm = ({ user, token }: Props) => {
  useEffect(() => {
    checkToken(token).then((resetAlreadyUsed) => {
      setResetLinkAlreadyUsed(resetAlreadyUsed)
    })
  }, [])

  useEffect(() => {
    if (user) {
      signOut({ redirect: false })
    }
  }, [user])

  const t = useTranslations('login.form')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [resetLinkAlreadyUsed, setResetLinkAlreadyUsed] = useState(false)

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    await reset(email, password, token)
  }

  if (resetLinkAlreadyUsed) {
    return <ResetAlreadyUsed />
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
      />
      <Button type="submit" data-testid="reset-button">
        {t('reset')}
      </Button>
    </form>
  )
}

export default ResetForm
