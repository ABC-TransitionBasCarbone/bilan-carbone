'use client'

import Block from '@/components/base/Block'
import HelpIcon from '@/components/base/HelpIcon'
import IconLabel from '@/components/base/IconLabel'
import { FormAutocomplete } from '@/components/form/Autocomplete'
import { FormDatePicker } from '@/components/form/DatePicker'
import { FormRadio } from '@/components/form/Radio'
import { FormSelect } from '@/components/form/Select'
import GlobalNewStudyForm from '@/components/study/new/Form'
import StudyExportsForm from '@/components/study/perimeter/StudyExportsForm'
import { getOrganizationVersionAccounts } from '@/db/organization'
import { FullStudy } from '@/db/study'
import { CreateStudyCommand } from '@/services/serverFunctions/study.command'
import { getAllowedLevels } from '@/services/study'
import { FormControlLabel, MenuItem, Radio } from '@mui/material'
import { UserSession } from 'next-auth'
import { useTranslations } from 'next-intl'
import { useMemo, useState } from 'react'
import { UseFormReturn, useWatch } from 'react-hook-form'
import styles from './Form.module.css'

interface Props {
  user: UserSession
  accounts: Awaited<ReturnType<typeof getOrganizationVersionAccounts>>
  form: UseFormReturn<CreateStudyCommand>
  duplicateStudyId?: string | null
  sourceStudy?: FullStudy | null
}

const NewStudyForm = ({ user, accounts, form, duplicateStudyId, sourceStudy }: Props) => {
  const t = useTranslations('study.new')
  const tGlossary = useTranslations('study.new.glossary')
  const [glossary, setGlossary] = useState('')

  const tLevel = useTranslations('level')

  const Help = (name: string) => (
    <HelpIcon className="ml-4" onClick={() => setGlossary(name)} label={tGlossary('title')} />
  )

  const exports = useWatch(form).exports

  const showControl = useMemo(() => Object.values(exports || {}).some((value) => value), [exports])

  return (
    <Block title={t('title')} as="h1">
      <GlobalNewStudyForm
        form={form}
        glossary={glossary}
        setGlossary={setGlossary}
        t={t}
        duplicateStudyId={duplicateStudyId}
      >
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
        <StudyExportsForm
          form={form}
          showControl={showControl}
          setGlossary={setGlossary}
          t={t}
          duplicateStudyId={duplicateStudyId}
          study={sourceStudy ?? undefined}
        />
      </GlobalNewStudyForm>
    </Block>
  )
}

export default NewStudyForm
