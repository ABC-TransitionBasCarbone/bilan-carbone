'use client'

import Form from '@/components/base/Form'
import IconLabel from '@/components/base/IconLabel'
import LoadingButton from '@/components/base/LoadingButton'
import { FormAutocomplete } from '@/components/form/Autocomplete'
import { FormDatePicker } from '@/components/form/DatePicker'
import { FormRadio } from '@/components/form/Radio'
import { FormSelect } from '@/components/form/Select'
import { FormTextField } from '@/components/form/TextField'
import GlossaryModal from '@/components/modals/GlossaryModal'
import { getOrganizationVersionAccounts } from '@/db/organization'
import { createStudyCommand } from '@/services/serverFunctions/study'
import { CreateStudyCommand } from '@/services/serverFunctions/study.command'
import { getAllowedLevels } from '@/services/study'
import { FormControlLabel, MenuItem, Radio } from '@mui/material'
import { UserSession } from 'next-auth'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useMemo, useState } from 'react'
import { UseFormReturn, useWatch } from 'react-hook-form'
import HelpIcon from '../../base/HelpIcon'
import StudyExportsForm from '../perimeter/StudyExportsForm'
import styles from './Form.module.css'

interface Props {
  user: UserSession
  accounts: Awaited<ReturnType<typeof getOrganizationVersionAccounts>>
  form: UseFormReturn<CreateStudyCommand>
  children?: React.ReactNode
}

const NewStudyForm = ({ user, accounts, form, children }: Props) => {
  const router = useRouter()
  const t = useTranslations('study.new')
  const tGlossary = useTranslations('study.new.glossary')
  const tLevel = useTranslations('level')
  const [glossary, setGlossary] = useState('')
  const [error, setError] = useState('')

  const onSubmit = async (command: CreateStudyCommand) => {
    const result = await createStudyCommand(command)
    if (!result.success) {
      setError(result.errorMessage)
    } else {
      router.push(`/etudes/${result.data.id}`)
      router.refresh()
    }
  }

  const exports = useWatch(form).exports
  const showControl = useMemo(() => Object.values(exports || {}).some((value) => value), [exports])

  const Help = (name: string) => (
    <HelpIcon className="ml-4" onClick={() => setGlossary(name)} label={tGlossary('title')} />
  )

  return (
    <>
      <Form onSubmit={form.handleSubmit(onSubmit)}>
        <FormTextField
          data-testid="new-study-name"
          control={form.control}
          translation={t}
          name="name"
          label={t('name')}
        />
        <FormAutocomplete
          data-testid="new-validator-name"
          control={form.control}
          translation={t}
          options={accounts.map((user) => user.user.email)}
          name="validator"
          label={t('validator')}
          icon={<HelpIcon onClick={() => setGlossary('validatorEmail')} label={tGlossary('title')} />}
          iconPosition="after"
        />
        <div>
          <IconLabel icon={Help('studyDates')} iconPosition="after" className="mb-2">
            <span className="inputLabel bold">{t('studyDates')}</span>
          </IconLabel>
          <div className={styles.dates}>
            <FormDatePicker control={form.control} translation={t} name="startDate" label={t('start')} />
            <FormDatePicker
              control={form.control}
              translation={t}
              name="endDate"
              label={t('end')}
              data-testid="new-study-endDate"
            />
          </div>
        </div>
        <div>
          <IconLabel icon={Help('realizationDates')} iconPosition="after" className="mb-2">
            <span className="inputLabel bold">{t('realizationDates')}</span>
          </IconLabel>
          <div className={styles.dates}>
            <FormDatePicker
              control={form.control}
              translation={t}
              name="realizationStartDate"
              label={t('start')}
              clearable
            />
            <FormDatePicker
              control={form.control}
              translation={t}
              name="realizationEndDate"
              label={t('end')}
              data-testid="new-study-realizationEndDate"
              clearable
            />
          </div>
        </div>
        <FormSelect
          control={form.control}
          translation={t}
          name="level"
          label={t('level')}
          data-testid="new-study-level"
          icon={<HelpIcon onClick={() => setGlossary('type')} label={tGlossary('title')} />}
          iconPosition="after"
        >
          {getAllowedLevels(user.level).map((key) => (
            <MenuItem key={key} value={key}>
              {tLevel(key)}
            </MenuItem>
          ))}
        </FormSelect>
        <FormRadio
          control={form.control}
          translation={t}
          name="isPublic"
          row
          label={t('isPublicTitle')}
          icon={<HelpIcon onClick={() => setGlossary('visibility')} label={tGlossary('title')} />}
          iconPosition="after"
        >
          <FormControlLabel value="true" control={<Radio />} label={t('public')} />
          <FormControlLabel value="false" control={<Radio />} label={t('private')} />
        </FormRadio>
        <StudyExportsForm form={form} showControl={showControl} setGlossary={setGlossary} t={t} />
        {children}
        <LoadingButton type="submit" loading={form.formState.isSubmitting} data-testid="new-study-create-button">
          {t('create')}
        </LoadingButton>
        {error && <p>{t(`error.${error}`)}</p>}
      </Form>
      {glossary && (
        <GlossaryModal glossary={glossary} onClose={() => setGlossary('')} label="emission-source" t={tGlossary}>
          <p className="mb-2">
            {tGlossary.rich(`${glossary}Description`, {
              link: (children) => (
                <Link
                  href="https://www.bilancarbone-methode.com/1-cadrage-de-la-demarche/1.1-definir-son-niveau-de-maturite-bilan-carbone-r"
                  target="_blank"
                  rel="noreferrer noopener"
                >
                  {children}
                </Link>
              ),
            })}
          </p>
        </GlossaryModal>
      )}
    </>
  )
}

export default NewStudyForm
