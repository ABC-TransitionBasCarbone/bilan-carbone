'use client'
import { ResetPasswordCommand, ResetPasswordCommandValidation } from './user.command'
import { computePasswordValidation } from '@abc-transitionbascarbone/utils/auth'
import Form from '@abc-transitionbascarbone/components/src/base/Form'
import LoadingButton from '@abc-transitionbascarbone/components/src/base/LoadingButton'
import { FormTextField } from '@abc-transitionbascarbone/components/src/form/TextField'
import { zodResolver } from '@hookform/resolvers/zod'
import Visibility from '@mui/icons-material/Visibility'
import VisibilityOff from '@mui/icons-material/VisibilityOff'
import { FormControl, IconButton, InputAdornment } from '@mui/material'
import { useTranslations } from 'next-intl'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import authStyles from './Auth.module.css'

interface Props {
  token: string
  resetPassword: (email: string, password: string, token: string) => Promise<void>
  submitting: boolean
  setSubmitting: (submitting: boolean) => void
}

const ResetFormCommon = ({ resetPassword, token, setSubmitting, submitting }: Props) => {
  const t = useTranslations('login.form')
  const [showPassword1, setShowPassword1] = useState(false)
  const [showPassword2, setShowPassword2] = useState(false)
  const [passwordValidation, setPasswordValidation] = useState({
    length: false,
    uppercase: false,
    lowercase: false,
    specialChar: false,
    digit: false,
  })

  const { getValues, control, watch, handleSubmit } = useForm<ResetPasswordCommand>({
    resolver: zodResolver(ResetPasswordCommandValidation),
    mode: 'onBlur',
    reValidateMode: 'onChange',
    defaultValues: {
      email: '',
    },
  })

  useEffect(() => {
    const { unsubscribe } = watch((values) => setPasswordValidation(computePasswordValidation(values.password ?? '')))

    return () => unsubscribe()
  }, [watch])

  const onSubmit = async () => {
    setSubmitting(true)

    const { email, password } = getValues()
    await resetPassword(email.toLowerCase(), password, token)
  }

  return (
    <Form onSubmit={handleSubmit(onSubmit)} className="mt1">
      <FormControl className={authStyles.form}>
        <p>{t('resetTitle')}</p>
        <FormTextField
          control={control}
          name="email"
          data-testid="input-email"
          className={authStyles.input}
          label={t('email')}
          placeholder={t('emailPlaceholder')}
          trim
        />
        <FormTextField
          control={control}
          data-testid="input-password"
          className={authStyles.input}
          label={t('password')}
          placeholder={t('passwordPlaceholder')}
          name="password"
          type={showPassword1 ? 'text' : 'password'}
          endAdornment={
            <InputAdornment position="end">
              <IconButton
                aria-label={showPassword2 ? t('hidePassword') : t('showPassword')}
                onClick={() => setShowPassword1((show) => !show)}
              >
                {showPassword1 ? <VisibilityOff /> : <Visibility />}
              </IconButton>
            </InputAdornment>
          }
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
        <FormTextField
          control={control}
          data-testid="input-confirm-password"
          className={authStyles.input}
          label={t('confirmPassword')}
          name="confirmPassword"
          type={showPassword2 ? 'text' : 'password'}
          endAdornment={
            <InputAdornment position="end">
              <IconButton
                aria-label={showPassword2 ? t('hidePassword') : t('showPassword')}
                onClick={() => setShowPassword2((show) => !show)}
              >
                {showPassword2 ? <VisibilityOff /> : <Visibility />}
              </IconButton>
            </InputAdornment>
          }
          error={getValues().password !== getValues().confirmPassword && getValues().confirmPassword !== ''}
          helperText={
            getValues().password !== getValues().confirmPassword && getValues().confirmPassword !== ''
              ? t('notMatching')
              : ''
          }
        />
        <LoadingButton
          fullWidth
          type="submit"
          data-testid="reset-button"
          loading={submitting}
          disabled={
            getValues().password !== getValues().confirmPassword ||
            Object.values(passwordValidation).some((rule) => !rule)
          }
        >
          {t('reset')}
        </LoadingButton>
      </FormControl>
    </Form>
  )
}

export default ResetFormCommon
