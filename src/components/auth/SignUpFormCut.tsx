'use client'

import { getEnvRoute } from '@/services/email/utils'
import { signUpCutUser } from '@/services/serverFunctions/user'
import { SignUpCutCommand, SignUpCutCommandValidation } from '@/services/serverFunctions/user.command'
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
import { getAllCNCs } from '@/services/serverFunctions/cnc'
import { FormAutocomplete } from '../form/Autocomplete'
import { useServerFunction } from '@/hooks/useServerFunction'

const contactMail = process.env.NEXT_PUBLIC_ABC_SUPPORT_MAIL
const faq = process.env.NEXT_PUBLIC_ABC_FAQ_LINK || ''

const SignUpFormCut = async () => {
  const t = useTranslations('signupCut')
  const tForm = useTranslations('login.form')
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState('')
  const [success, setSuccess] = useState(false)
  const [cncs, setCNCS] = useState<CNC[]>([])
  const { callServerFunction } = useServerFunction()

  const searchParams = useSearchParams()

  useEffect(() => {
    const fetchCNCs = async () => {
      const response = await callServerFunction(async () => {
        const data = await getAllCNCs()
        return { success: true, data } // wrap in ApiResponse
      })

      if (response.success) {
        setCNCS(response.data)
      }
    }
    fetchCNCs()

    const email = searchParams.get('email')
    if (email) {
      setValue('email', email)
    }
  }, [searchParams, callServerFunction])


  const { control, getValues, setValue, handleSubmit } = useForm<SignUpCutCommand>({
    resolver: zodResolver(SignUpCutCommandValidation),
    mode: 'onBlur',
    reValidateMode: 'onChange',
    defaultValues: {
      email: searchParams.get('email') ?? '',
    },
  })

  const onSubmit = async () => {
    setMessage('')
    setSubmitting(true)

    const activation = await signUpCutUser(getValues().email, getValues().siretOrCNC)
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
          translation={t}
          name="email"
          className={authStyles.input}
          label={t('email')}
          placeholder={t('emailPlaceholder')}
          data-testid="activation-email"
        />
        <FormAutocomplete
          control={control}
          translation={t}
          options={cncs}
          name="siretOrCNC"
          label={t('siretOrCNC')}
          className={authStyles.input}
          getOptionLabel={(option) => (typeof option === 'string' ? option : option.label)}
          filterOptions={(options, { inputValue }) =>
            options.filter((option) =>
              typeof option === 'string' ? option : option.label.toLowerCase().includes(inputValue.toLowerCase()),
            )
          }
          freeSolo
          data-testid="activation-siretOrCNC"
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
          <Link className="ml-2" href={getEnvRoute('login', Environment.CUT)} prefetch={false}>
            {tForm('login')}
          </Link>
        </div>
      </FormControl>
    </Form>
  )
}

export default SignUpFormCut
