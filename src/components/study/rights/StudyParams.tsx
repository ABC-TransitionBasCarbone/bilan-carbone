'use client'

import { useCallback, useMemo, useState } from 'react'

import Block from '@/components/base/Block'
import Button from '@/components/base/Button'
import { FormTextField } from '@/components/form/TextField'
import Modal from '@/components/modals/Modal'
import { FullStudy } from '@/db/study'
import { useServerFunction } from '@/hooks/useServerFunction'
import { changeStudyName } from '@/services/serverFunctions/study'
import { ChangeStudyNameCommand, ChangeStudyNameValidation } from '@/services/serverFunctions/study.command'
import { zodResolver } from '@hookform/resolvers/zod'
import EditIcon from '@mui/icons-material/Edit'
import { EmissionFactorImportVersion, Environment } from '@prisma/client'
import { UserSession } from 'next-auth'
import { useTranslations } from 'next-intl'
import { useForm } from 'react-hook-form'
import StudyLevel from './StudyLevel'
import styles from './StudyParams.module.css'
import StudyPublicStatus from './StudyPublicStatus'
import StudyResultsUnit from './StudyResultsUnit'
import StudyVersions from './StudyVersions'

interface Props {
  user: UserSession
  study: FullStudy
  disabled: boolean
  emissionFactorSources: EmissionFactorImportVersion[]
}

const StudyParams = ({ user, study, disabled, emissionFactorSources }: Props) => {
  const t = useTranslations('study.rights')
  const tValidation = useTranslations('study.rights.new')

  const [editTitle, setEditTitle] = useState(false)
  const { callServerFunction } = useServerFunction()

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

  const resetInput = useCallback(() => {
    form.setValue('name', study.name)
    setEditTitle(false)
  }, [form, study])

  const handleSubmit = useCallback(
    async (data: ChangeStudyNameCommand) => {
      if (name === study.name) {
        resetInput()
        return
      }

      await callServerFunction(() => changeStudyName(data), {
        onSuccess: () => {
          setEditTitle(false)
          study.name = name
        },
      })
    },
    [name, study, callServerFunction, resetInput],
  )

  const isCut = useMemo(() => user.environment === Environment.CUT, [user?.environment])

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
        {!isCut && (
          <>
            <div className="flex pb2">
              <StudyLevel study={study} user={user} disabled={disabled} />
              <StudyResultsUnit study={study} disabled={disabled} />
            </div>
            <div className="flex">
              <StudyPublicStatus study={study} user={user} disabled={disabled} />
              <StudyVersions study={study} emissionFactorSources={emissionFactorSources} canUpdate={!disabled} />
            </div>
          </>
        )}
      </Block>
      <Modal
        open={editTitle}
        label={'edit-study-title'}
        title={t('edit')}
        onClose={resetInput}
        actions={[{ actionType: 'button', onClick: form.handleSubmit(handleSubmit), children: t('edit') }]}
      >
        <FormTextField name="name" translation={tValidation} control={form.control} required />
      </Modal>
    </>
  )
}

export default StudyParams
