'use client'

import Block from '@/components/base/Block'
import Button from '@/components/base/Button'
import Form from '@/components/base/Form'
import { FormAutocomplete } from '@/components/form/Autocomplete'
import { FormDatePicker } from '@/components/form/DatePicker'
import { FormRadio } from '@/components/form/Radio'
import { FormSelect } from '@/components/form/Select'
import { FormTextField } from '@/components/form/TextField'
import { OrganizationWithSites } from '@/db/user'
import { createStudyCommand } from '@/services/serverFunctions/study'
import { CreateStudyCommand, CreateStudyCommandValidation } from '@/services/serverFunctions/study.command'
import { getAllowedLevels } from '@/services/study'
import { zodResolver } from '@hookform/resolvers/zod'
import { FormControl, FormControlLabel, FormGroup, FormHelperText, FormLabel, MenuItem, Radio } from '@mui/material'
import { Export } from '@prisma/client'
import dayjs from 'dayjs'
import { User } from 'next-auth'
import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import ExportCheckbox from './ExportCheckbox'
import styles from './Form.module.css'

interface Props {
  user: User
  usersEmail: string[]
  organization: OrganizationWithSites
}

const NewStudyForm = ({ organization, user, usersEmail }: Props) => {
  const router = useRouter()
  const t = useTranslations('study.new')
  const tExport = useTranslations('exports')
  const tLevel = useTranslations('level')
  const [error, setError] = useState('')

  const form = useForm<CreateStudyCommand>({
    resolver: zodResolver(CreateStudyCommandValidation),
    mode: 'onBlur',
    reValidateMode: 'onChange',
    defaultValues: {
      name: '',
      validator: '',
      organizationId: organization.id,
      isPublic: 'true',
      startDate: dayjs().toISOString(),
      exports: {
        [Export.Beges]: false,
        [Export.GHGP]: false,
        [Export.ISO14069]: false,
      },
    },
  })

  const onSubmit = async (command: CreateStudyCommand) => {
    const result = await createStudyCommand(command)
    if (!result.success) {
      setError(result.message)
    } else {
      router.push(`/etudes/${result.id}`)
      router.refresh()
    }
  }

  return (
    <Block title={t('title')} as="h1">
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
          options={usersEmail}
          name="validator"
          label={t('validator')}
        />
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
        <FormSelect
          control={form.control}
          translation={t}
          name="level"
          label={t('level')}
          data-testid="new-study-level"
        >
          {getAllowedLevels(user.level).map((key) => (
            <MenuItem key={key} value={key}>
              {tLevel(key)}
            </MenuItem>
          ))}
        </FormSelect>
        <FormRadio control={form.control} translation={t} name="isPublic" row label={t('isPublicTitle')}>
          <FormControlLabel value="true" control={<Radio />} label={t('public')} />
          <FormControlLabel value="false" control={<Radio />} label={t('private')} />
        </FormRadio>

        <Controller
          name="exports"
          control={form.control}
          render={({ field: { onChange, value }, fieldState: { error } }) => (
            <FormControl error={!!error} component="fieldset">
              <FormLabel component="legend">{tExport('exports')}</FormLabel>
              <FormGroup>
                <div className={styles.exports}>
                  {Object.keys(Export).map((key) => (
                    <ExportCheckbox key={key} id={key as Export} values={value} setValues={onChange} />
                  ))}
                </div>
              </FormGroup>
              {error && error.message && <FormHelperText>{t('validation.' + error.message)}</FormHelperText>}
            </FormControl>
          )}
        />
        <Button type="submit" disabled={form.formState.isSubmitting} data-testid="new-study-create-button">
          {t('create')}
        </Button>
        {error && <p>{t(`error.${error}`)}</p>}
      </Form>
    </Block>
  )
}

export default NewStudyForm
