'use client'

import { useCallback, useMemo, useState } from 'react'

import Block, { Action } from '@/components/base/Block'
import { FormTextField } from '@/components/form/TextField'
import Modal from '@/components/modals/Modal'
import { FullStudy } from '@/db/study'
import { changeStudyName } from '@/services/serverFunctions/study'
import { ChangeStudyNameCommand, ChangeStudyNameValidation } from '@/services/serverFunctions/study.command'
import { zodResolver } from '@hookform/resolvers/zod'
import EditIcon from '@mui/icons-material/Edit'
import { User } from 'next-auth'
import { useTranslations } from 'next-intl'
import { useForm } from 'react-hook-form'
import StudyLevel from './StudyLevel'
import styles from './StudyParams.module.css'
import StudyPublicStatus from './StudyPublicStatus'

interface Props {
  user: User
  study: FullStudy
  disabled: boolean
}

const StudyParams = ({ user, study, disabled }: Props) => {
  const t = useTranslations('study.rights')
  const tValidation = useTranslations('study.rights.new')

  const [editTitle, setEditTitle] = useState(false)
  const [error, setError] = useState('')

  const actions: Action[] = useMemo(
    () =>
      disabled
        ? []
        : [
            {
              actionType: 'button',
              className: styles.iconButton,
              'aria-label': t('edit'),
              title: t('edit'),
              children: <EditIcon color="info" />,
              onClick: () => setEditTitle(true),
            },
          ],
    [disabled, t],
  )

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
      <Block title={t('title', { name: study.name })} as="h1" actions={actions}>
        <StudyLevel study={study} user={user} disabled={disabled} />
        <StudyPublicStatus study={study} user={user} disabled={disabled} />
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
