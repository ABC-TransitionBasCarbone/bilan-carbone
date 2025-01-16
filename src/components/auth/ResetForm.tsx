'use client'
import { checkToken, reset } from '@/services/serverFunctions/auth'
import { computePasswordValidation } from '@/services/utils'
import Visibility from '@mui/icons-material/Visibility'
import VisibilityOff from '@mui/icons-material/VisibilityOff'
import { IconButton, InputAdornment, TextField } from '@mui/material'
import { User } from 'next-auth'
import { signOut } from 'next-auth/react'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { FormEvent, useEffect, useMemo, useState } from 'react'
import Button from '../base/Button'
import ResetLinkAlreadyUsed from '../pages/ResetLinkAlreadyUsed'
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

  const router = useRouter()
  const t = useTranslations('login.form')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [resetLinkAlreadyUsed, setResetLinkAlreadyUsed] = useState(false)
  const [showPassword1, setShowPassword1] = useState(false)
  const [showPassword2, setShowPassword2] = useState(false)
  const [error, setError] = useState(false)

  const passwordValidation = useMemo(() => computePasswordValidation(password), [password])

  if (resetLinkAlreadyUsed) {
    return <ResetLinkAlreadyUsed />
  }

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(false)
    const result = await reset(email, password, token)
    if (result) {
      router.push('/login')
    } else {
      setError(true)
    }
  }

  return (
    <form onSubmit={onSubmit} className={authStyles.form}>
      <p>{t('resetTitle')}</p>
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
        value={password}
        label={t('password')}
        type={showPassword1 ? 'text' : 'password'}
        onChange={(event) => setPassword(event.target.value)}
        slotProps={{
          input: {
            endAdornment: (
              <InputAdornment position="end">
                <IconButton
                  aria-label={showPassword1 ? t('hidePassword') : t('showPassword')}
                  onClick={() => setShowPassword1((show) => !show)}
                >
                  {showPassword1 ? <VisibilityOff /> : <Visibility />}
                </IconButton>
              </InputAdornment>
            ),
          },
        }}
      />
      <ul>
        <li className={passwordValidation.length ? authStyles.green : authStyles.red}>{t('passwordLength')}</li>
        <li className={passwordValidation.uppercase ? authStyles.green : authStyles.red}>{t('passwordUppercase')}</li>
        <li className={passwordValidation.lowercase ? authStyles.green : authStyles.red}>{t('passwordLowercase')}</li>
        <li className={passwordValidation.specialChar ? authStyles.green : authStyles.red}>
          {t('passwordSpecialChar')}
        </li>
        <li className={passwordValidation.digit ? authStyles.green : authStyles.red}>{t('passwordDigit')}</li>
      </ul>
      <TextField
        data-testid="input-confirm-password"
        className={authStyles.input}
        required
        value={confirmPassword}
        label={t('confirmPassword')}
        type={showPassword2 ? 'text' : 'password'}
        onChange={(event) => setConfirmPassword(event.target.value)}
        slotProps={{
          input: {
            endAdornment: (
              <InputAdornment position="end">
                <IconButton
                  aria-label={showPassword2 ? t('hidePassword') : t('showPassword')}
                  onClick={() => setShowPassword2((show) => !show)}
                >
                  {showPassword2 ? <VisibilityOff /> : <Visibility />}
                </IconButton>
              </InputAdornment>
            ),
          },
        }}
        error={password !== confirmPassword && confirmPassword !== ''}
        helperText={password !== confirmPassword && confirmPassword !== '' ? t('notMatching') : ''}
      />
      {error && (
        <p className={authStyles.red}>
          {t('resetError')}
          <Link href={`mailto:${process.env.NEXT_PUBLIC_ABC_SUPPORT_MAIL}`}>
            {process.env.NEXT_PUBLIC_ABC_SUPPORT_MAIL}
          </Link>
        </p>
      )}
      <Button type="submit" data-testid="reset-button">
        {t('reset')}
      </Button>
    </form>
  )
}

export default ResetForm
