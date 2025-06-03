'use client'

import Form from '@/components/base/Form'
import LoadingButton from '@/components/base/LoadingButton'
import { FormAutocomplete } from '@/components/form/Autocomplete'
import { FormSelect } from '@/components/form/Select'
import { getOrganizationVersionAccounts } from '@/db/organization'
import { FullStudy } from '@/db/study'
import { ALREADY_IN_STUDY } from '@/services/permissions/check'
import { newStudyRight } from '@/services/serverFunctions/study'
import { NewStudyRightCommand, NewStudyRightCommandValidation } from '@/services/serverFunctions/study.command'
import { checkLevel } from '@/services/study'
import { isAdmin } from '@/utils/user'
import { zodResolver } from '@hookform/resolvers/zod'
import { MenuItem } from '@mui/material'
import { StudyRole } from '@prisma/client'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { SyntheticEvent, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import NewStudyRightModal from './NewStudyRightModal'

interface Props {
  study: FullStudy
  accounts: Awaited<ReturnType<typeof getOrganizationVersionAccounts>>
  existingAccounts: string[]
  accountRole: StudyRole
}

const contactMail = process.env.NEXT_PUBLIC_ABC_SUPPORT_MAIL
const faq = process.env.NEXT_PUBLIC_ABC_FAQ_LINK || ''

const NewStudyRightForm = ({ study, accounts, existingAccounts, accountRole }: Props) => {
  const router = useRouter()
  const t = useTranslations('study.rights.new')
  const tRole = useTranslations('study.role')

  const [error, setError] = useState('')
  const [readerOnly, setReaderOnly] = useState(false)
  const [otherOrganizationVersion, setOtherOrganizationVersion] = useState(false)

  const filteredAccounts = useMemo(
    () =>
      accounts
        .filter((account) => !existingAccounts.includes(account.user.email))
        .filter((account) => !isAdmin(account.role)),
    [accounts],
  )

  const form = useForm<NewStudyRightCommand>({
    resolver: zodResolver(NewStudyRightCommandValidation),
    mode: 'onBlur',
    reValidateMode: 'onChange',
    defaultValues: {
      studyId: study.id,
      email: '',
    },
  })

  const onEmailChange = (_: SyntheticEvent, value: string | null) => {
    form.setValue('email', value || '')
    if (value) {
      const organizationVersionAccount = accounts.find((account) => account.user.email === value)
      if (!organizationVersionAccount || checkLevel(organizationVersionAccount.user.level, study.level)) {
        setReaderOnly(false)
      } else {
        setReaderOnly(true)
        form.setValue('role', StudyRole.Reader)
      }
    }
  }

  const saveRight = async (command: NewStudyRightCommand) => {
    const result = await newStudyRight(command)
    setOtherOrganizationVersion(false)
    if (!result.success) {
      setError(result.errorMessage)
    } else {
      router.push(`/etudes/${study.id}/cadrage`)
      router.refresh()
    }
  }

  const onSubmit = async (command: NewStudyRightCommand) => {
    if (accounts.some((account) => account.user.email === command.email)) {
      await saveRight(command)
    } else if (existingAccounts.includes(command.email)) {
      setError(ALREADY_IN_STUDY)
    } else {
      setOtherOrganizationVersion(true)
    }
  }

  const usersOptions = useMemo(
    () =>
      filteredAccounts.map((account) => ({
        label: `${account.user.firstName} ${account.user.lastName.toUpperCase()} - ${account.user.email}`,
        value: account.user.email,
      })),
    [filteredAccounts],
  )

  const allowedRoles = useMemo(
    () =>
      Object.keys(StudyRole).filter(
        (role) =>
          (accountRole === StudyRole.Validator || role !== StudyRole.Validator) &&
          (!readerOnly || role === StudyRole.Reader),
      ),
    [accountRole, readerOnly],
  )

  return (
    <>
      <Form onSubmit={form.handleSubmit(onSubmit)}>
        <FormAutocomplete
          data-testid="study-rights-email"
          control={form.control}
          translation={t}
          options={usersOptions}
          getOptionLabel={(option) => (typeof option === 'string' ? option : option.label)}
          filterOptions={(options, { inputValue }) =>
            options.filter((option) =>
              typeof option === 'string' ? option : option.label.toLowerCase().includes(inputValue.toLowerCase()),
            )
          }
          name="email"
          label={t('email')}
          onInputChange={onEmailChange}
          freeSolo
        />
        <FormSelect
          control={form.control}
          translation={t}
          name="role"
          label={t('role')}
          data-testid="study-rights-role"
          disabled={allowedRoles.length < 2}
        >
          {allowedRoles.map((key) => (
            <MenuItem key={key} value={key}>
              {tRole(key)}
            </MenuItem>
          ))}
        </FormSelect>
        <LoadingButton type="submit" loading={form.formState.isSubmitting} data-testid="study-rights-create-button">
          {t('create')}
        </LoadingButton>
        {error && (
          <p data-testid="study-rights-create-error">
            {t.rich(error, {
              support: (children) => <Link href={`mailto:${contactMail}`}>{children}</Link>,
              link: (children) => (
                <Link href={faq} target="_blank" rel="noreferrer noopener">
                  {children}
                </Link>
              ),
            })}
          </p>
        )}
      </Form>
      <NewStudyRightModal
        otherOrganizationVersion={otherOrganizationVersion}
        rightsWarning={form.getValues().role !== StudyRole.Reader}
        decline={() => setOtherOrganizationVersion(false)}
        accept={() => saveRight(form.getValues())}
      />
    </>
  )
}

export default NewStudyRightForm
