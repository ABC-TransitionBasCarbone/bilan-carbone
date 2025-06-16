'use client'

import { FullStudy } from '@/db/study'
import { useServerFunction } from '@/hooks/useServerFunction'
import { deleteStudyCommand } from '@/services/serverFunctions/study'
import { DeleteCommand, DeleteCommandValidation } from '@/services/serverFunctions/study.command'
import { downloadStudyEmissionSources } from '@/services/study'
import { zodResolver } from '@hookform/resolvers/zod'
import CopyIcon from '@mui/icons-material/ContentCopy'
import DeleteIcon from '@mui/icons-material/Delete'
import DownloadIcon from '@mui/icons-material/Download'
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
  canDeleteStudy?: boolean
  canDuplicateStudy?: boolean
  studySite: string
  setSite: Dispatch<SetStateAction<string>>
}

const StudyDetailsHeader = ({ study, canDeleteStudy, canDuplicateStudy, studySite, setSite }: Props) => {
  const [deleting, setDeleting] = useState(false)
  const [duplicating, setDuplicating] = useState(false)
  const { callServerFunction } = useServerFunction()
  const format = useFormatter()
  const tStudyDelete = useTranslations('study.delete')
  const tStudyExport = useTranslations('study.export')
  const tCaracterisations = useTranslations('categorisations')
  const tExport = useTranslations('exports')
  const tPost = useTranslations('emissionFactors.post')
  const tQuality = useTranslations('quality')
  const tUnit = useTranslations('units')
  const tResultUnits = useTranslations('study.results.units')
  const tStudy = useTranslations('study')
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
          variant: 'contained',
          color: 'secondary',
          tooltip: tStudyDelete('delete'),
        },
      ]
    : []

  const duplicateAction: BlockProps['actions'] = canDuplicateStudy
    ? [
        {
          actionType: 'button',
          onClick: () => setDuplicating(true),
          tooltip: tStudy('duplicate'),
          children: <CopyIcon />,
        },
      ]
    : []

  const exportAction: BlockProps['actions'] =
    study.organizationVersion.environment === Environment.BC
      ? [
          {
            actionType: 'button',
            onClick: () =>
              downloadStudyEmissionSources(
                study,
                tStudyExport,
                tCaracterisations,
                tPost,
                tQuality,
                tUnit,
                tResultUnits,
              ),
            disabled: study.emissionSources.length === 0,
            variant: 'contained',
            color: 'secondary',
            children: (
              <>
                {tStudyExport('download')}
                <DownloadIcon />
              </>
            ),
          },
        ]
      : []

  return (
    <Block
      title={study.name}
      as="h1"
      icon={study.isPublic ? <LockOpenIcon /> : <LockIcon />}
      actions={[...duplicateAction, ...exportAction, ...deleteAction]}
      description={
        <div className={styles.studyInfo}>
          <p>
            {format.dateTime(study.startDate, { year: 'numeric', day: 'numeric', month: 'long' })} -{' '}
            {format.dateTime(study.endDate, { year: 'numeric', day: 'numeric', month: 'long' })}
          </p>
          {study.exports.length > 0 && (
            <p>
              {tExport('title')} {study.exports.map((e) => e.type).join(', ')}
            </p>
          )}
        </div>
      }
    >
      <SelectStudySite study={study} allowAll studySite={studySite} setSite={setSite} />
      {deleting && (
        <DeletionModal
          form={form}
          type="study"
          onDelete={onDelete}
          onClose={() => setDeleting(false)}
          t={tStudyDelete}
        />
      )}
      {duplicating && <DuplicateStudyModal study={study} open={duplicating} onClose={() => setDuplicating(false)} />}
    </Block>
  )
}

export default StudyDetailsHeader
