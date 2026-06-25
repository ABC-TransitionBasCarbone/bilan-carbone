'use client'

import { signUpWithModelCampaign } from '@/services/serverFunctions/user'
import { SignUpCommand, SignUpCommandValidation } from '@/services/serverFunctions/user.command'
import Form from '@abc-transitionbascarbone/components/src/base/Form'
import LoadingButton from '@abc-transitionbascarbone/components/src/base/LoadingButton'
import { FormTextField } from '@abc-transitionbascarbone/components/src/form/TextField'
import { zodResolver } from '@hookform/resolvers/zod'
import { FormControl } from '@mui/material'
import classNames from 'classnames'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import authStyles from './Auth.module.css'

interface Props {
  modelCampaignId: string
}

const SignUpForm = ({ modelCampaignId }: Props) => {
  const t = useTranslations('signup')
  const tForm = useTranslations('login.form')
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState('')
  const [success, setSuccess] = useState(false)

  const { control, getValues, setValue, handleSubmit } = useForm<SignUpCommand>({
    resolver: zodResolver(SignUpCommandValidation),
    mode: 'onBlur',
    reValidateMode: 'onChange',
    defaultValues: {
      email: '',
    },
  })

  const contactMail = process.env.NEXT_PUBLIC_SUPPORT_EMAIL

  const onSubmit = async () => {
    setMessage('')
    setSubmitting(true)

    const activation = await signUpWithModelCampaign(getValues().email, modelCampaignId)
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
          data-testid="input-email"
          control={control}
          name="email"
          className={authStyles.input}
          label={t('email')}
          placeholder={t('emailPlaceholder')}
        />
        <LoadingButton type="submit" loading={submitting} variant="contained" data-testid="submit-button" fullWidth>
          {t('validate')}
        </LoadingButton>
        {message && (
          <>
            <p className={classNames(!success ? 'error' : '')}>{t(message)}</p>
            {!success ? (
              <p>
                {t('support')} : <Link href={`mailto:${contactMail}`}>{contactMail}</Link>
              </p>
            ) : null}
          </>
        )}
        <div className={authStyles.bottomLink}>
          {tForm('alreadyRegistered')}
          <Link className="ml-2" href="/login" prefetch={false}>
            {tForm('login')}
          </Link>
        </div>
      </FormControl>
    </Form>
  )
}

export default SignUpForm
