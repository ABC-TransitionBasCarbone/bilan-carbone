'use client'
import Button from '@/components/base/Button'
import { FullStudy } from '@/db/study'
import { allowedFlowFileTypes, downloadFromUrl, maxAllowedFileSize, MB } from '@/services/file'
import { getDocumentUrl } from '@/services/serverFunctions/file'
import { addFlowToStudy, deleteFlowFromStudy } from '@/services/serverFunctions/study'
import DeleteIcon from '@mui/icons-material/Delete'
import DownloadIcon from '@mui/icons-material/Download'
import { InputLabel, Button as MUIButton } from '@mui/material'
import { Document } from '@prisma/client'
import classNames from 'classnames'
import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Block from '../../../base/Block'
import FlowSelector from './FlowSelector'
import styles from './StudyFlow.module.css'
import StudyFlowViewer from './StudyFlowViewer'

interface Props {
  study: FullStudy
  documents: Document[]
  initialDocument?: Document
}

const StudyFlow = ({ study, documents, initialDocument }: Props) => {
  const t = useTranslations('study.flow')
  const tUpload = useTranslations('upload')

  const router = useRouter()
  const [error, setError] = useState('')
  const [selectedFlow, setSelectedFlow] = useState<Document | undefined>(initialDocument)

  useEffect(() => {
    setSelectedFlow(initialDocument)
  }, [initialDocument])

  const addFlow = async (event: React.ChangeEvent<HTMLInputElement>) => {
    setError('')
    const file = event.target.files?.[0]
    if (!file) {
      setError(tUpload('noFileSelected'))
      return
    }
    if (file.size > maxAllowedFileSize) {
      setError(tUpload('fileTooBig', { size: maxAllowedFileSize / MB }))
      return
    }

    const result = await addFlowToStudy(study.id, file)
    if (result) {
      setError(t(result))
      return
    }
    router.refresh()
  }

  const downloadDocument = async () => {
    if (!selectedFlow) {
      return
    }
    const url = await getDocumentUrl(selectedFlow, study.id)
    downloadFromUrl(url, selectedFlow.name)
  }

  const removeDocument = async () => {
    setError('')
    if (!selectedFlow) {
      return
    }
    const result = await deleteFlowFromStudy(selectedFlow, study.id)
    if (result) {
      setError(t(result))
      return
    }
    router.refresh()
  }

  return (
    <Block
      title={t('flows', { name: study.name })}
      as="h1"
      actions={[
        {
          actionType: 'button',
          component: 'label',
          role: undefined,
          variant: 'contained',
          tabIndex: -1,
          children: (
            <div className="align-center">
              {t('addFlow')}
              <input
                id="flow-upload-input"
                className={styles.flowUploadButton}
                type="file"
                value=""
                accept={allowedFlowFileTypes.join(',')}
                onChange={addFlow}
              />
            </div>
          ),
        },
      ]}
    >
      {error && <div className={classNames(styles.error, 'mb1')}>{error}</div>}
      {selectedFlow ? (
        <div className="flex-col">
          <div className="flex-col mb1">
            <InputLabel id="flow-selector-label">{t('flowSelector')}</InputLabel>
            <div className={classNames(styles.flowButtons, 'flex grow')}>
              <FlowSelector documents={documents} selectedFlow={selectedFlow} setSelectedFlow={setSelectedFlow} />
              <Button
                aria-label={t('download')}
                title={t('download')}
                data-testid="flow-mapping-download"
                onClick={downloadDocument}
              >
                <DownloadIcon />
              </Button>
              <MUIButton
                data-testid="flow-mapping-delete"
                onClick={removeDocument}
                variant="contained"
                color="error"
                title={t('removeFlow')}
                aria-label={t('removeFlow')}
              >
                <DeleteIcon />
              </MUIButton>
            </div>
          </div>
          <StudyFlowViewer selectedFlow={selectedFlow} studyId={study.id} />
        </div>
      ) : (
        t('noFlows')
      )}
    </Block>
  )
}

export default StudyFlow
