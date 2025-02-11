'use client'

import Block from '@/components/base/Block'
import Form from '@/components/base/Form'
import LoadingButton from '@/components/base/LoadingButton'
import Modal from '@/components/base/Modal'
import { FormAutocomplete } from '@/components/form/Autocomplete'
import { FormDatePicker } from '@/components/form/DatePicker'
import { FormRadio } from '@/components/form/Radio'
import { FormSelect } from '@/components/form/Select'
import { FormTextField } from '@/components/form/TextField'
import { getOrganizationUsers } from '@/db/organization'
import { createStudyCommand } from '@/services/serverFunctions/study'
import { CreateStudyCommand } from '@/services/serverFunctions/study.command'
import { getAllowedLevels } from '@/services/study'
import { FormControl, FormControlLabel, FormGroup, FormHelperText, FormLabel, MenuItem, Radio } from '@mui/material'
import { Export } from '@prisma/client'
import classNames from 'classnames'
import { User } from 'next-auth'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useMemo, useState } from 'react'
import { Controller, UseFormReturn, useWatch } from 'react-hook-form'
import HelpIcon from '../../base/HelpIcon'
import formStyles from '../../form/Form.module.css'
import ExportCheckbox from './ExportCheckbox'
import styles from './Form.module.css'

interface Props {
  user: User
  users: Awaited<ReturnType<typeof getOrganizationUsers>>
  form: UseFormReturn<CreateStudyCommand>
}

const NewStudyForm = ({ user, users, form }: Props) => {
  const router = useRouter()
  const t = useTranslations('study.new')
  const tGlossary = useTranslations('study.new.glossary')
  const tLevel = useTranslations('level')
  const [glossary, setGlossary] = useState('')
  const [error, setError] = useState('')

  const onSubmit = async (command: CreateStudyCommand) => {
    const result = await createStudyCommand(command)
    if (!result.success) {
      setError(result.message)
    } else {
      router.push(`/etudes/${result.id}`)
      router.refresh()
    }
  }

  const exports = useWatch(form).exports
  const showControl = useMemo(() => Object.values(exports || {}).some((value) => value), [exports])

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
          options={users.map((user) => user.email)}
          name="validator"
          label={t('validator')}
          icon={<HelpIcon onClick={() => setGlossary('validatorEmail')} label={tGlossary('title')} />}
          iconPosition="after"
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

        <Controller
          name="exports"
          control={form.control}
          render={({ field: { onChange, value }, fieldState: { error } }) => (
            <FormControl error={!!error} component="fieldset">
              <div className="flex mb-2">
                <FormLabel component="legend" className={styles.exportsLabel}>
                  <div className={classNames(formStyles.gapped, 'align-center')}>
                    <span className="inputLabel bold">{t('exports')}</span>
                    <div className={formStyles.icon}>
                      {<HelpIcon onClick={() => setGlossary('exports')} label={tGlossary('title')} />}
                    </div>
                  </div>
                </FormLabel>
                {showControl && (
                  <FormLabel component="legend">
                    <div className={classNames(formStyles.gapped, 'align-center')}>
                      <span className="inputLabel bold">{t('control')}</span>
                      <div className={formStyles.icon}>
                        {<HelpIcon onClick={() => setGlossary('control')} label={tGlossary('title')} />}
                      </div>
                    </div>
                  </FormLabel>
                )}
              </div>
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
        <LoadingButton type="submit" loading={form.formState.isSubmitting} data-testid="new-study-create-button">
          {t('create')}
        </LoadingButton>
        {error && <p>{t(`error.${error}`)}</p>}
      </Form>
      {glossary !== '' && (
        <Modal
          open
          label="new-study-glossary"
          title={tGlossary(glossary)}
          onClose={() => setGlossary('')}
          actions={[{ actionType: 'button', onClick: () => setGlossary(''), children: tGlossary('close') }]}
        >
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
        </Modal>
      )}
    </Block>
  )
}

export default NewStudyForm
