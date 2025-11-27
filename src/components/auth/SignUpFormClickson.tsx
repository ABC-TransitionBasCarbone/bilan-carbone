'use client'

import { useServerFunction } from '@/hooks/useServerFunction'
import { getEnvVar } from '@/lib/environment'
import { getEnvRoute } from '@/services/email/utils'
import { UNKNOWN_SCHOOL } from '@/services/permissions/check'
import { getSchoolsFromPostalCodeOrName, School } from '@/services/schoolApi'
import { signUpWithSchool } from '@/services/serverFunctions/user'
import { SignUpClicksonCommand, SignUpClicksonCommandValidation } from '@/services/serverFunctions/user.command'
import { zodResolver } from '@hookform/resolvers/zod'
import { FormControl, Tooltip } from '@mui/material'
import { Environment } from '@prisma/client'
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

const SignUpFormClickson = () => {
  const contactMail = getEnvVar('SUPPORT_EMAIL', Environment.CLICKSON)
  const faq = getEnvVar('FAQ_LINK', Environment.CLICKSON)

  const t = useTranslations('signupClickson')
  const tForm = useTranslations('login.form')
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState('')
  const [success, setSuccess] = useState(false)
  const [schools, setSchools] = useState<School[]>([])
  const [schoolPostalCodeOrName, setSchoolPostalCodeOrName] = useState('')
  const { callServerFunction } = useServerFunction()

  const searchParams = useSearchParams()

  const { control, getValues, setValue, handleSubmit } = useForm<SignUpClicksonCommand>({
    resolver: zodResolver(SignUpClicksonCommandValidation),
    mode: 'onBlur',
    reValidateMode: 'onChange',
    defaultValues: {
      email: searchParams.get('email') ?? '',
      schoolName: '',
    },
  })

  useEffect(() => {
    const fetchSchools = async () => {
      const response = await callServerFunction(async () => {
        const data = await getSchoolsFromPostalCodeOrName(schoolPostalCodeOrName)
        return { success: true, data }
      })

      if (response.success && response.data && response.data.length > 0) {
        setSchools(response.data)
      }
    }

    fetchSchools()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [schoolPostalCodeOrName])

  useEffect(() => {
    const email = searchParams.get('email')
    if (email) {
      setValue('email', email)
    }
  }, [searchParams, setValue])

  const onSubmit = async () => {
    setMessage('')
    setSubmitting(true)

    const school = schools.find((s) => s.nom_etablissement === getValues().schoolName)
    if (!school) {
      setSubmitting(false)
      setSuccess(false)
      setMessage(UNKNOWN_SCHOOL)
      return
    }

    const activation = await signUpWithSchool(getValues().email, school, Environment.CLICKSON)
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
          data-testid="activation-school"
          control={control}
          translation={t}
          options={
            schoolPostalCodeOrName.length < 3
              ? []
              : schools.map((school) => ({
                  label: `${school.nom_etablissement} - ${school.adresse_1} (${school.code_postal})`,
                  value: school.nom_etablissement,
                  testId: `school-option-${school.identifiant_de_l_etablissement}`,
                }))
          }
          renderOption={(props, option) => {
            const dataTestId = typeof option === 'string' ? undefined : (option as { testId?: string }).testId
            const label = typeof option === 'string' ? option : option.label
            return (
              <li {...props} data-testid={dataTestId}>
                {label}
              </li>
            )
          }}
          name="schoolName"
          label={
            <Tooltip title={t('schoolSearchTooltip')} arrow>
              <span>{t('schoolPostalCodeOrName')}</span>
            </Tooltip>
          }
          helperText={t('schoolPostalCodeOrNamePlaceholder')}
          freeSolo
          disableClearable
          onInputChange={(_, value) => {
            setSchoolPostalCodeOrName(value)
            setValue('schoolName', value)
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
          <Link className="ml-2" href={getEnvRoute('login', Environment.CLICKSON)} prefetch={false}>
            {tForm('login')}
          </Link>
        </div>
      </FormControl>
    </Form>
  )
}

export default SignUpFormClickson
