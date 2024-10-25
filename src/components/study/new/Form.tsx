'use client'

import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { FormControl, FormControlLabel, FormGroup, FormHelperText, FormLabel, MenuItem, Radio } from '@mui/material'
import { useTranslations } from 'next-intl'
import React, { useState } from 'react'
import styles from './Form.module.css'
import { Export } from '@prisma/client'
import { createStudyCommand } from '@/services/serverFunctions/study'
import { CreateStudyCommand, CreateStudyCommandValidation } from '@/services/serverFunctions/study.command'
import { FormTextField } from '@/components/form/TextField'
import { FormDatePicker } from '@/components/form/DatePicker'
import { FormSelect } from '@/components/form/Select'
import { FormRadio } from '@/components/form/Radio'
import ExportCheckbox from './ExportCheckbox'
import Button from '@/components/base/Button'
import { OrganizationWithSites } from '@/db/user'
import { useRouter } from 'next/navigation'
import dayjs from 'dayjs'
import Form from '@/components/base/Form'
import { getAllowedLevels } from '@/services/study'
import { User } from 'next-auth'
import Block from '@/components/base/Block'

interface Props {
  user: User
  organization: OrganizationWithSites
}

const NewStudyForm = ({ organization, user }: Props) => {
  const router = useRouter()
  const t = useTranslations('study.new')
  const tLevel = useTranslations('level')
  const [error, setError] = useState('')

  const form = useForm<CreateStudyCommand>({
    resolver: zodResolver(CreateStudyCommandValidation),
    mode: 'onBlur',
    reValidateMode: 'onChange',
    defaultValues: {
      organizationId: organization.id,
      isPublic: true,
      startDate: dayjs(),
      exports: {
        [Export.Beges]: false,
        [Export.GHGP]: false,
        [Export.ISO14069]: false,
      },
    },
  })

  const onSubmit = async (command: CreateStudyCommand) => {
    const result = await createStudyCommand(command)
    if (result) {
      setError(result)
    } else {
      router.push('/')
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
        <FormRadio control={form.control} translation={t} name="isPublic" row label={t('is-public-title')}>
          <FormControlLabel value="true" control={<Radio />} label={t('public')} />
          <FormControlLabel value="false" control={<Radio />} label={t('private')} />
        </FormRadio>

        <Controller
          name="exports"
          control={form.control}
          render={({ field: { onChange, value }, fieldState: { error } }) => (
            <FormControl error={!!error} component="fieldset">
              <FormLabel component="legend">{t('exports')}</FormLabel>
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
        {error && <p>{error}</p>}
      </Form>
    </Block>
  )
}

export default NewStudyForm
