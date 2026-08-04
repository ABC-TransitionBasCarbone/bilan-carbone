'use client'

import { FullStudy } from '@/db/study'
import { hasAccessToDownloadStudyEmissionSourcesButton } from '@/services/permissions/environment'
import { deleteStudyCommand } from '@/services/serverFunctions/study'
import { DeleteCommand, DeleteCommandValidation } from '@/services/serverFunctions/study.command'
import { Props as BlockProps } from '@abc-transitionbascarbone/components/src/base/Block'
import { useServerFunction } from '@abc-transitionbascarbone/components/src/hooks/useServerFunction'
import { Environment, StudyRole } from '@abc-transitionbascarbone/db-common/enums'
import { useToast } from '@abc-transitionbascarbone/ui'
import { zodResolver } from '@hookform/resolvers/zod'
import DeleteIcon from '@mui/icons-material/Delete'
import CopyIcon from '@mui/icons-material/FileCopy'
import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { ReactNode, useState } from 'react'
import { useForm } from 'react-hook-form'
import DeletionModal from '../modals/DeletionModal'
import DuplicateStudyModal from '../modals/DuplicateStudyModal'
import EmissionSourceButtons from './buttons/EmissionSourceButtons'

interface Props {
  study: FullStudy
  organizationVersionId: string | null
  canDeleteStudy?: boolean
  canDuplicateStudy?: boolean
  duplicableEnvironments: Environment[]
  userRole: StudyRole
  siteId: string
  children: (actions: BlockProps['actions']) => ReactNode
}

const StudyManagementActions = ({
  study,
  organizationVersionId,
  canDeleteStudy,
  canDuplicateStudy,
  duplicableEnvironments,
  userRole,
  siteId,
  children,
}: Props) => {
  const [deleting, setDeleting] = useState(false)
  const [duplicating, setDuplicating] = useState(false)
  const { callServerFunction } = useServerFunction()
  const t = useTranslations('study')
  const tStudyDelete = useTranslations('study.delete')
  const tImport = useTranslations('study.importEmissionSourcesModal')
  const tCommon = useTranslations('common')
  const router = useRouter()
  const { showSuccessToast } = useToast()

  const form = useForm<DeleteCommand>({
    resolver: zodResolver(DeleteCommandValidation),
    mode: 'onBlur',
    reValidateMode: 'onChange',
    defaultValues: {
      id: study.id,
      name: '',
    },
  })

  const onDelete = async () => {
    await callServerFunction(() => deleteStudyCommand(form.getValues()), {
      getErrorMessage: (error) => (tStudyDelete.has(error) ? tStudyDelete(error) : tCommon('error')),
      onSuccess: () => {
        router.push('/')
      },
    })
  }

  const deleteAction: BlockProps['actions'] = canDeleteStudy
    ? [
        {
          actionType: 'button',
          'data-testid': 'delete-study',
          onClick: () => setDeleting(true),
          children: <DeleteIcon />,
          title: t('deleteStudy'),
          variant: 'contained',
          color: 'error',
        },
      ]
    : []

  const duplicateAction: BlockProps['actions'] = canDuplicateStudy
    ? [
        {
          actionType: 'button',
          'data-testid': 'duplicate-study',
          onClick: () => setDuplicating(true),
          children: <CopyIcon />,
          color: 'secondary',
          variant: 'outlined',
          title: t('duplicate'),
        },
      ]
    : []

  const downloadEmissionSourceAction: BlockProps['actions'] =
    hasAccessToDownloadStudyEmissionSourcesButton(study.organizationVersion.environment) && !study.simplified
      ? [
          {
            actionType: 'node',
            node: (
              <EmissionSourceButtons
                studyId={study.id}
                userRole={userRole}
                siteId={siteId}
                hasEmissionSources={study.emissionSources.length > 0}
                onSuccess={() => {
                  showSuccessToast(tImport('success'))
                  router.refresh()
                }}
              />
            ),
          },
        ]
      : []

  return (
    <>
      {children([...duplicateAction, ...deleteAction, ...downloadEmissionSourceAction])}
      {deleting && (
        <DeletionModal
          form={form}
          type="study"
          onDelete={onDelete}
          onClose={() => setDeleting(false)}
          t={tStudyDelete}
        />
      )}
      {duplicating && (
        <DuplicateStudyModal
          studyId={study.id}
          organizationVersionId={organizationVersionId}
          sourceEnvironment={study.organizationVersion.environment}
          environments={duplicableEnvironments}
          onClose={() => setDuplicating(false)}
          open
        />
      )}
    </>
  )
}

export default StudyManagementActions
