'use client'

import { getEnvVar } from '@/lib/environment'
import { getEnvRoute } from '@/services/email/utils'
import { signUpWithSiretOrCNC } from '@/services/serverFunctions/user'
import { SignUpTiltCommand, SignUpTiltCommandValidation } from '@/services/serverFunctions/user.command'
import { zodResolver } from '@hookform/resolvers/zod'
import { FormControl } from '@mui/material'
import { Environment } from '@prisma/client'
import classNames from 'classnames'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import Form from '../base/Form'
import LoadingButton from '../base/LoadingButton'
import { FormTextField } from '../form/TextField'
import authStyles from './Auth.module.css'

const SignUpFormTilt = () => {
  const contactMail = getEnvVar('SUPPORT_EMAIL', Environment.TILT)
  const faq = getEnvVar('FAQ_LINK', Environment.TILT)

  const t = useTranslations('signup')
  const tForm = useTranslations('login.form')
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState('')
  const [success, setSuccess] = useState(false)

  const searchParams = useSearchParams()

  useEffect(() => {
    const email = searchParams.get('email')
    if (email) {
      setValue('email', email)
    }
  }, [searchParams])

  const { control, getValues, setValue, handleSubmit } = useForm<SignUpTiltCommand>({
    resolver: zodResolver(SignUpTiltCommandValidation),
    mode: 'onBlur',
    reValidateMode: 'onChange',
    defaultValues: {
      email: searchParams.get('email') ?? '',
    },
  })

  const onSubmit = async () => {
    setMessage('')
    setSubmitting(true)

    const activation = await signUpWithSiretOrCNC(getValues().email, getValues().siret, Environment.TILT)
    setSubmitting(false)

    if (activation.success) {
      setSuccess(true)
      setMessage(activation.data)
    } else {
      setSuccess(false)
      setMessage(activation.errorMessage)
    }
  }

  return (
    <Form onSubmit={handleSubmit(onSubmit)} className="grow justify-center">
      <FormControl className={authStyles.form}>
        <FormTextField
          control={control}
          name="email"
          className={authStyles.input}
          label={t('email')}
          placeholder={t('emailPlaceholder')}
          data-testid="activation-email"
        />
        <FormTextField
          control={control}
          name="siret"
          className={authStyles.input}
          label={t('siret')}
          placeholder={t('siretPlaceholder')}
          data-testid="activation-siret"
        />
        <LoadingButton data-testid="activation-button" type="submit" loading={submitting} variant="contained" fullWidth>
          {t('validate')}
        </LoadingButton>
        {message && (
          <p className={classNames(!success ? 'error' : '')} data-testid="activation-form-message">
            {t.rich(message, {
              support: (children) => <Link href={`mailto:${contactMail}`}>{children}</Link>,
              link: (children) => (
                <Link href={faq} target="_blank" rel="noreferrer noopener">
                  {children}
                </Link>
              ),
            })}
          </p>
        )}
        <div className={authStyles.bottomLink}>
          {tForm('alreadyRegistered')}
          <Link className="ml-2" href={getEnvRoute('login', Environment.TILT)} prefetch={false}>
            {tForm('login')}
          </Link>
        </div>
      </FormControl>
    </Form>
  )
}

export default SignUpFormTilt
