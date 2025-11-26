'use client'
import { useServerFunction } from '@/hooks/useServerFunction'
import { signOutEnv } from '@/services/auth'
import { getEnvRoute } from '@/services/email/utils'
import { checkToken, reset } from '@/services/serverFunctions/auth'
import { ResetPasswordCommand, ResetPasswordCommandValidation } from '@/services/serverFunctions/user.command'
import { computePasswordValidation } from '@/services/utils'
import { zodResolver } from '@hookform/resolvers/zod'
import Visibility from '@mui/icons-material/Visibility'
import VisibilityOff from '@mui/icons-material/VisibilityOff'
import { FormControl, IconButton, InputAdornment } from '@mui/material'
import { Environment } from '@prisma/client'
import { UserSession } from 'next-auth'
import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import Form from '../base/Form'
import LoadingButton from '../base/LoadingButton'
import { FormTextField } from '../form/TextField'
import ResetLinkAlreadyUsed from '../pages/ResetLinkAlreadyUsed'
import authStyles from './Auth.module.css'

interface Props {
  user?: UserSession
  token: string
  environment?: Environment
}

const ResetForm = ({ user, token, environment = Environment.BC }: Props) => {
  useEffect(() => {
    checkToken(token).then((invalidtoken) => {
      setInvalidResetLink(invalidtoken)
    })
  }, [token])

  useEffect(() => {
    if (user) {
      signOutEnv(environment, { redirect: false })
    }
  }, [user])

  const router = useRouter()
  const t = useTranslations('login.form')
  const [invalidResetLink, setInvalidResetLink] = useState(false)
  const [showPassword1, setShowPassword1] = useState(false)
  const [showPassword2, setShowPassword2] = useState(false)
  const [passwordValidation, setPasswordValidation] = useState({
    length: false,
    uppercase: false,
    lowercase: false,
    specialChar: false,
    digit: false,
  })
  const [submitting, setSubmitting] = useState(false)
  const { callServerFunction } = useServerFunction()

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

  if (invalidResetLink) {
    return <ResetLinkAlreadyUsed />
  }

  const loginLink = getEnvRoute('login', environment)

  const onSubmit = async () => {
    setSubmitting(true)

    const { email, password } = getValues()
    await callServerFunction(() => reset(email.toLowerCase(), password, token, environment), {
      getSuccessMessage: () => t('validated'),
      getErrorMessage: () => t('resetError'),
      onSuccess: () => {
        setSubmitting(false)
        router.push(loginLink)
      },
      onError: () => {
        setSubmitting(false)
      },
    })
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

export default ResetForm
