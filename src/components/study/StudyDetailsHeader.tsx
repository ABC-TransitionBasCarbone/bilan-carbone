'use client'

import { FullStudy } from '@/db/study'
import { useServerFunction } from '@/hooks/useServerFunction'
import { deleteStudyCommand } from '@/services/serverFunctions/study'
import { DeleteCommand, DeleteCommandValidation } from '@/services/serverFunctions/study.command'
import { zodResolver } from '@hookform/resolvers/zod'
import CopyIcon from '@mui/icons-material/ContentCopy'
import DeleteIcon from '@mui/icons-material/Delete'
import LockIcon from '@mui/icons-material/Lock'
import LockOpenIcon from '@mui/icons-material/LockOpen'
import { Environment } from '@prisma/client'
import { useFormatter, useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { Dispatch, SetStateAction, useState } from 'react'
import { useForm } from 'react-hook-form'
import Block, { Props as BlockProps } from '../base/Block'
import DeletionModal from '../modals/DeletionModal'
import DuplicateStudyModal from '../modals/DuplicateStudyModal'
import styles from './StudyDetailsHeader.module.css'
import SelectStudySite from './site/SelectStudySite'

interface Props {
  study: FullStudy
  organizationVersionId: string | null
  canDeleteStudy?: boolean
  canDuplicateStudy?: boolean
  duplicableEnvironments: Environment[]
  studySite: string
  setSite: Dispatch<SetStateAction<string>>
}

const StudyDetailsHeader = ({
  study,
  organizationVersionId,
  canDeleteStudy,
  canDuplicateStudy,
  duplicableEnvironments,
  studySite,
  setSite,
}: Props) => {
  const [deleting, setDeleting] = useState(false)
  const [duplicating, setDuplicating] = useState(false)
  const { callServerFunction } = useServerFunction()
  const format = useFormatter()
  const t = useTranslations('study')
  const tStudyDelete = useTranslations('study.delete')
  const tExport = useTranslations('exports')
  const router = useRouter()

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
      getErrorMessage: (error) => tStudyDelete(error),
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
          title: t('duplicate'),
        },
      ]
    : []

  return (
    <>
      <Block
        title={study.name}
        as="h2"
        icon={study.isPublic ? <LockOpenIcon /> : <LockIcon />}
        actions={[...duplicateAction, ...deleteAction]}
        description={
          <div className={styles.studyInfo}>
            <p>
              {format.dateTime(study.startDate, { year: 'numeric', day: 'numeric', month: 'long' })} -{' '}
              {format.dateTime(study.endDate, { year: 'numeric', day: 'numeric', month: 'long' })}
            </p>
            {study.exports && study.exports.types.length > 0 && (
              <p>
                {tExport('title')} {study.exports.types.join(', ')}
              </p>
            )}
          </div>
        }
        rightComponent={<SelectStudySite sites={study.sites} defaultValue={studySite} setSite={setSite} />}
      />
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

export default StudyDetailsHeader
