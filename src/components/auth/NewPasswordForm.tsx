'use client'

import { useTranslations } from 'next-intl'
import React, { FormEvent, useEffect, useState } from 'react'
import authStyles from './Auth.module.css'
import Input from '../base/Input'
import Button from '../base/Button'
import { useSearchParams } from 'next/navigation'

interface Props {
  reset: (email: string) => Promise<void>
}

const NewPasswordForm = ({ reset }: Props) => {
  const t = useTranslations('login.form')
  const [email, setEmail] = useState('')

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    await reset(email)
  }

  const searchParams = useSearchParams()
  useEffect(() => {
    const email = searchParams.get('email')
    if (email) {
      setEmail(email)
    }
  }, [searchParams])

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
      <Button type="submit" data-testid="reset-button">
        {t('reset')}
      </Button>
    </form>
  )
}

export default NewPasswordForm
