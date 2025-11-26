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
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import StudyLevel from './StudyLevel'
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
  const router = useRouter()

  const [editTitle, setEditTitle] = useState(false)
  const [loading, setLoading] = useState(false)
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

  const resetInput = useCallback(() => {
    form.setValue('name', study.name)
    setEditTitle(false)
  }, [form, study])

  const handleSubmit = useCallback(async () => {
    setLoading(true)

    await form.handleSubmit(async (data) => {
      if (data.name === study.name) {
        resetInput()
        return
      }

      await callServerFunction(() => changeStudyName(data), {
        onSuccess: () => {
          setEditTitle(false)
          router.refresh()
        },
      })
    })()

    setLoading(false)
  }, [form, study.name, callServerFunction, resetInput, router])

  const isCut = useMemo(() => user.environment === Environment.CUT, [user?.environment])

  return (
    <>
      <Block
        title={t('title', { name: study.name })}
        as="h2"
        icon={
          disabled ? (
            <></>
          ) : (
            <Button aria-label={t('edit')} title={t('edit')} onClick={() => setEditTitle(true)}>
              <EditIcon />
            </Button>
          )
        }
        iconPosition="after"
      >
        <h3 className="mb1">{t('general')}</h3>
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
        actions={[
          {
            actionType: 'loadingButton',
            onClick: () => handleSubmit(),
            loading,
            children: t('edit'),
          },
        ]}
      >
        <FormTextField name="name" control={form.control} required />
      </Modal>
    </>
  )
}

export default StudyParams
