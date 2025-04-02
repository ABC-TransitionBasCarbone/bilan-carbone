'use client'

import { useCallback, useState } from 'react'

import Block from '@/components/base/Block'
import Button from '@/components/base/Button'
import { FormTextField } from '@/components/form/TextField'
import Modal from '@/components/modals/Modal'
import { FullStudy } from '@/db/study'
import { changeStudyName } from '@/services/serverFunctions/study'
import { ChangeStudyNameCommand, ChangeStudyNameValidation } from '@/services/serverFunctions/study.command'
import { zodResolver } from '@hookform/resolvers/zod'
import EditIcon from '@mui/icons-material/Edit'
import { EmissionFactorImportVersion } from '@prisma/client'
import { User } from 'next-auth'
import { useTranslations } from 'next-intl'
import { useForm } from 'react-hook-form'
import StudyLevel from './StudyLevel'
import styles from './StudyParams.module.css'
import StudyPublicStatus from './StudyPublicStatus'
import StudyResultsUnit from './StudyResultsUnit'
import StudyVersions from './StudyVersions'

interface Props {
  user: User
  study: FullStudy
  disabled: boolean
  emissionFactorSources: EmissionFactorImportVersion[]
}

const StudyParams = ({ user, study, disabled, emissionFactorSources }: Props) => {
  const t = useTranslations('study.rights')
  const tValidation = useTranslations('study.rights.new')

  const [editTitle, setEditTitle] = useState(false)
  const [error, setError] = useState('')

  const form = useForm<ChangeStudyNameCommand>({
    resolver: zodResolver(ChangeStudyNameValidation),
    mode: 'onBlur',
    reValidateMode: 'onChange',
    defaultValues: {
      studyId: study.id,
      name: study.name,
    },
  })

  const name = form.watch('name')

  const resetInput = () => {
    form.setValue('name', study.name)
    setError('')
    setEditTitle(false)
  }

  const onSubmit = useCallback(
    form.handleSubmit(async (data) => {
      if (name === study.name) {
        resetInput()
        return
      }
      const result = await changeStudyName(data)
      if (result) {
        setError(result)
        return
      }
      setEditTitle(false)
      study.name = name
    }),
    [name, study, form],
  )

  return (
    <>
      <Block
        title={t('title', { name: study.name })}
        as="h1"
        icon={
          disabled ? (
            <></>
          ) : (
            <div className="ml1">
              <Button aria-label={t('edit')} title={t('edit')} onClick={() => setEditTitle(true)}>
                <EditIcon />
              </Button>
            </div>
          )
        }
        iconPosition="after"
        className={styles.blockStudyParams}
      >
        <div className="flex pb2">
          <StudyLevel study={study} user={user} disabled={disabled} />
          <StudyResultsUnit study={study} disabled={disabled} />
        </div>
        <div className="flex">
          <StudyPublicStatus study={study} user={user} disabled={disabled} />
          <StudyVersions study={study} emissionFactorSources={emissionFactorSources} canUpdate={!disabled} />
        </div>
      </Block>
      <Modal
        open={editTitle}
        label={'edit-study-title'}
        title={t('edit')}
        onClose={resetInput}
        actions={[{ actionType: 'button', onClick: onSubmit, children: t('edit') }]}
      >
        <FormTextField
          name="name"
          translation={tValidation}
          control={form.control}
          error={!!form.formState.errors.name}
          helperText={form.formState.errors.name?.message}
          required
        />
        {error && <p>{error}</p>}
      </Modal>
    </>
  )
}

export default StudyParams
