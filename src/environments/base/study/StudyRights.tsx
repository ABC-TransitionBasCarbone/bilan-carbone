'use client'

import Block from '@/components/base/Block'
import Button from '@/components/base/Button'
import { FormTextField } from '@/components/form/TextField'
import Modal from '@/components/modals/Modal'
import StudyContributorsTable from '@/components/study/rights/StudyContributorsTable'
import StudyParams from '@/components/study/rights/StudyParams'
import StudyRightsTable from '@/components/study/rights/StudyRightsTable'
import SelectStudySite from '@/components/study/site/SelectStudySite'
import { FullStudy } from '@/db/study'
import { useServerFunction } from '@/hooks/useServerFunction'
import { changeStudyName } from '@/services/serverFunctions/study'
import { ChangeStudyNameCommand, ChangeStudyNameValidation } from '@/services/serverFunctions/study.command'
import { zodResolver } from '@hookform/resolvers/zod'
import EditIcon from '@mui/icons-material/Edit'
import { EmissionFactorImportVersion, StudyRole } from '@prisma/client'
import { UserSession } from 'next-auth'
import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { useCallback, useState } from 'react'
import { useForm } from 'react-hook-form'

interface Props {
  user: UserSession
  study: FullStudy
  editionDisabled: boolean
  userRoleOnStudy: StudyRole
  emissionFactorSources: EmissionFactorImportVersion[]
}

const StudyRights = ({ user, study, editionDisabled, userRoleOnStudy, emissionFactorSources }: Props) => {
  const t = useTranslations('study.rights')
  const router = useRouter()
  const { callServerFunction } = useServerFunction()

  const [editTitle, setEditTitle] = useState(false)
  const [loading, setLoading] = useState(false)

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

  return (
    <Block
      title={t('title', { name: study.name })}
      as="h2"
      icon={
        editionDisabled ? null : (
          <Button aria-label={t('edit')} title={t('edit')} onClick={() => setEditTitle(true)}>
            <EditIcon />
          </Button>
        )
      }
      iconPosition="after"
      rightComponent={<SelectStudySite sites={study.sites} siteSelectionDisabled />}
    >
      <StudyParams user={user} study={study} disabled={editionDisabled} emissionFactorSources={emissionFactorSources} />
      <StudyRightsTable study={study} user={user} canAddMember={!editionDisabled} userRoleOnStudy={userRoleOnStudy} />
      <StudyContributorsTable study={study} canAddContributor={!editionDisabled} />
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
    </Block>
  )
}

export default StudyRights
