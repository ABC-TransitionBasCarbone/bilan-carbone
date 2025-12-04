'use client'

import { useServerFunction } from '@/hooks/useServerFunction'
import { getEnvVar } from '@/lib/environment'
import { getEnvRoute } from '@/services/email/utils'
import { getAllCNCs } from '@/services/serverFunctions/cnc'
import { signUpWithSiretOrCNC } from '@/services/serverFunctions/user'
import { SignUpCutCommand, SignUpCutCommandValidation } from '@/services/serverFunctions/user.command'
import { zodResolver } from '@hookform/resolvers/zod'
import { FormControl } from '@mui/material'
import { Cnc, Environment } from '@prisma/client'
import classNames from 'classnames'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import Form from '../base/Form'
import LoadingButton from '../base/LoadingButton'
import { FormAutocomplete } from '../form/Autocomplete'
import { FormTextField } from '../form/TextField'
import authStyles from './Auth.module.css'

const SignUpFormCut = () => {
  const contactMail = getEnvVar('SUPPORT_EMAIL', Environment.CUT)
  const faq = getEnvVar('FAQ_LINK', Environment.CUT)

  const t = useTranslations('signup')
  const tForm = useTranslations('login.form')
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState('')
  const [success, setSuccess] = useState(false)
  const [cncs, setCNCs] = useState<Cnc[]>([])
  const [siretOrCNC, setSiretOrCNC] = useState('')
  const { callServerFunction } = useServerFunction()

  const searchParams = useSearchParams()

  const { control, getValues, setValue, handleSubmit } = useForm<SignUpCutCommand>({
    resolver: zodResolver(SignUpCutCommandValidation),
    mode: 'onBlur',
    reValidateMode: 'onChange',
    defaultValues: {
      email: searchParams.get('email') ?? '',
      siretOrCNC: '',
    },
  })

  useEffect(() => {
    const fetchCNCs = async () => {
      const response = await callServerFunction(async () => {
        const data = await getAllCNCs()
        return { success: true, data }
      })

      if (response.success) {
        setCNCs(response.data)
      }
    }

    fetchCNCs()
  }, [setCNCs])

  useEffect(() => {
    const email = searchParams.get('email')
    if (email) {
      setValue('email', email)
    }
  }, [searchParams, setValue])

  const onSubmit = async () => {
    setMessage('')
    setSubmitting(true)

    const activation = await signUpWithSiretOrCNC(getValues().email, siretOrCNC, Environment.CUT)
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
        <FormAutocomplete
          data-testid="activation-siretOrCNC"
          control={control}
          translation={t}
          options={cncs.map((cnc) => ({
            label: `${cnc.nom} (Dep : ${cnc.dep} | Numéro CNC : ${cnc.cncCode})`,
            value: cnc.cncCode ?? '',
          }))}
          name="siretOrCNC"
          label={t('siretOrCNC')}
          helperText={t('siretOrCNCPlaceholder')}
          freeSolo
          disableClearable
          onInputChange={(_, value) => {
            setSiretOrCNC(value)
            setValue('siretOrCNC', value)
          }}
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
