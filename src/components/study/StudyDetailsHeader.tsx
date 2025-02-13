'use client'

import Form from '@/components/base/Form'
import { FullStudy } from '@/db/study'
import { deleteStudyCommand } from '@/services/serverFunctions/study'
import { DeleteStudyCommand, DeleteStudyCommandValidation } from '@/services/serverFunctions/study.command'
import { downloadStudyEmissionSources } from '@/services/study'
import { zodResolver } from '@hookform/resolvers/zod'
import DownloadIcon from '@mui/icons-material/Download'
import LockIcon from '@mui/icons-material/Lock'
import LockOpenIcon from '@mui/icons-material/LockOpen'
import { Dialog, DialogActions, DialogContent, DialogTitle } from '@mui/material'
import { useFormatter, useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { Dispatch, SetStateAction, useState } from 'react'
import { useForm } from 'react-hook-form'
import Block, { Props as BlockProps } from '../base/Block'
import Button from '../base/Button'
import LoadingButton from '../base/LoadingButton'
import { FormTextField } from '../form/TextField'
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

  const router = useRouter()

  const form = useForm<DeleteStudyCommand>({
    resolver: zodResolver(DeleteStudyCommandValidation),
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
    if (result) {
      setError(result)
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
          onClick: () => downloadStudyEmissionSources(study, tStudyExport, tCaracterisations, tPost, tQuality, tUnit),
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
      <Dialog open={deleting} aria-labelledby="delete-study-title" aria-describedby="delete-study-description">
        <Form onSubmit={form.handleSubmit(onDelete)}>
          <DialogTitle id="delete-study-modale-title">{tStudyDelete('title')}</DialogTitle>
          <DialogContent id="delete-study-modale-content">
            {tStudyDelete('content')}
            <div className="flex mt1">
              <FormTextField
                className="grow"
                control={form.control}
                name="name"
                label={tStudyDelete('name')}
                translation={tStudyDelete}
                data-testid="delete-study-name-field"
              />
            </div>
            {error && (
              <p data-testid="study-deletion-error" className={styles.error}>
                {tStudyDelete(error)}
              </p>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDeleting(false)}>{tStudyDelete('cancel')}</Button>
            <LoadingButton type="submit" loading={form.formState.isSubmitting} data-testid="confirm-study-deletion">
              {tStudyDelete('confirm')}
            </LoadingButton>
          </DialogActions>
        </Form>
      </Dialog>
    </Block>
  )
}

export default StudyDetailsHeader
