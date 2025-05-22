'use client'

import { FullStudy } from '@/db/study'
import { deleteStudyCommand } from '@/services/serverFunctions/study'
import { DeleteCommand, DeleteCommandValidation } from '@/services/serverFunctions/study.command'
import { downloadStudyEmissionSources } from '@/services/study'
import { zodResolver } from '@hookform/resolvers/zod'
import DownloadIcon from '@mui/icons-material/Download'
import LockIcon from '@mui/icons-material/Lock'
import LockOpenIcon from '@mui/icons-material/LockOpen'
import { useFormatter, useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { Dispatch, SetStateAction, useState } from 'react'
import { useForm } from 'react-hook-form'
import Block, { Props as BlockProps } from '../base/Block'
import DeletionModal from '../modals/DeletionModal'
import styles from './StudyDetailsHeader.module.css'
import SelectStudySite from './site/SelectStudySite'

interface Props {
  study: FullStudy
  canDeleteStudy?: boolean
  studySite: string
  setSite: Dispatch<SetStateAction<string>>
}
const StudyDetailsHeader = ({ study, canDeleteStudy, studySite, setSite }: Props) => {
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState('')
  const format = useFormatter()
  const tStudyDelete = useTranslations('study.delete')
  const tStudyExport = useTranslations('study.export')
  const tCaracterisations = useTranslations('categorisations')
  const tExport = useTranslations('exports')
  const tPost = useTranslations('emissionFactors.post')
  const tQuality = useTranslations('quality')
  const tUnit = useTranslations('units')
  const tResultUnits = useTranslations('study.results.units')

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
    setError('')
    const result = await deleteStudyCommand(form.getValues())
    if (!result.success) {
      setError(result.errorMessage)
    } else {
      router.push('/')
      router.refresh()
    }
  }

  const deleteAction: BlockProps['actions'] = canDeleteStudy
    ? [
        {
          actionType: 'button',
          'data-testid': 'delete-study',
          onClick: () => setDeleting(true),
          children: tStudyDelete('delete'),
        },
      ]
    : []

  return (
    <Block
      title={study.name}
      as="h1"
      icon={study.isPublic ? <LockOpenIcon /> : <LockIcon />}
      actions={[
        {
          actionType: 'button',
          onClick: () =>
            downloadStudyEmissionSources(study, tStudyExport, tCaracterisations, tPost, tQuality, tUnit, tResultUnits),
          disabled: study.emissionSources.length === 0,
          children: (
            <>
              {tStudyExport('download')}
              <DownloadIcon />
            </>
          ),
        },
        ...deleteAction,
      ]}
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
          error={error}
        />
      )}
    </Block>
  )
}

export default StudyDetailsHeader
