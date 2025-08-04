'use client'

import Block from '@/components/base/Block'
import Button from '@/components/base/Button'
import LoadingButton from '@/components/base/LoadingButton'
import { useToast } from '@/components/base/ToastProvider'
import { FullStudy } from '@/db/study'
import { useServerFunction } from '@/hooks/useServerFunction'
import { DEFAULT_SAMPLE_TITLE, SAMPLE_TITLES } from '@/services/documents'
import { allowedFlowFileTypes, downloadFromUrl, maxAllowedFileSize, MB } from '@/services/file'
import { hasAccessToStudyFlowExample } from '@/services/permissions/environment'
import { getDocumentSample } from '@/services/serverFunctions/documents'
import { getDocumentUrl } from '@/services/serverFunctions/file'
import { addDocumentToStudy, deleteDocumentFromStudy } from '@/services/serverFunctions/study'
import { useAppEnvironmentStore } from '@/store/AppEnvironment'
import DeleteIcon from '@mui/icons-material/Delete'
import DownloadIcon from '@mui/icons-material/Download'
import { Alert, InputLabel } from '@mui/material'
import { Document, DocumentCategory } from '@prisma/client'
import classNames from 'classnames'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import DocumentSelector from './DocumentSelector'
import DocumentViewer from './DocumentViewer'
import styles from './StudyFlow.module.css'

interface Props {
  title: string
  t: ReturnType<typeof useTranslations>
  study: FullStudy
  documents: Document[]
  initialDocument?: Document
  canUpload?: boolean
  documentCategory?: DocumentCategory
}

const StudyDocument = ({ title, t, study, documents, initialDocument, canUpload = true, documentCategory }: Props) => {
  const { callServerFunction } = useServerFunction()
  const { showErrorToast } = useToast()
  const router = useRouter()
  const tUpload = useTranslations('upload')

  const [uploading, setUploading] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [selectedDoc, setSelectedDoc] = useState<Document | undefined>(initialDocument)
  const { environment } = useAppEnvironmentStore()

  useEffect(() => {
    setSelectedDoc(initialDocument)
  }, [initialDocument])

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) {
      return showErrorToast(tUpload('noFileSelected'))
    }
    if (file.size > maxAllowedFileSize) {
      return showErrorToast(tUpload('fileTooBig', { size: maxAllowedFileSize / MB }))
    }

    setUploading(true)
    await callServerFunction(() => addDocumentToStudy(study.id, file, documentCategory), {
      getErrorMessage: (error) => t(error),
      onSuccess: () => router.refresh(),
    })
    setUploading(false)
  }

  const handleDownload = async () => {
    if (!selectedDoc) {
      return
    }
    setDownloading(true)
    await callServerFunction(() => getDocumentUrl(selectedDoc, study.id), {
      getErrorMessage: (error) => t(error),
      onSuccess: (url) => downloadFromUrl(url, selectedDoc.name),
    })
    setDownloading(false)
  }

  const handleDelete = async () => {
    if (!selectedDoc) {
      return
    }
    setDeleting(true)
    await callServerFunction(() => deleteDocumentFromStudy(selectedDoc, study.id), {
      getErrorMessage: (error) => t(error),
      onSuccess: () => router.refresh(),
    })
    setDeleting(false)
  }

  const handleSampleDownload = async () => {
    setDownloading(true)
    await callServerFunction(() => getDocumentSample(study.id, documentCategory), {
      getErrorMessage: (error) => t(error),
      onSuccess: (url) => {
        downloadFromUrl(url, documentCategory ? SAMPLE_TITLES[documentCategory] : DEFAULT_SAMPLE_TITLE)
      },
    })
    setDownloading(false)
  }

  return (
    <Block
      title={title}
      as="h1"
      actions={
        canUpload
          ? [
              {
                actionType: 'loadingButton',
                component: 'label',
                variant: 'contained',
                tabIndex: -1,
                loading: uploading,
                children: (
                  <div className="align-center">
                    {t('add')}
                    <input
                      className={styles.flowUploadButton}
                      type="file"
                      value=""
                      accept={allowedFlowFileTypes.join(',')}
                      onChange={handleUpload}
                    />
                  </div>
                ),
              },
            ]
          : undefined
      }
    >
      {environment && hasAccessToStudyFlowExample(environment) && (
        <div className="mb-2">
          <Alert severity="info" className="mb-2">
            {t.rich('info', {
              mail: (children) => <Link href={`mailto:methodologie@abc-transitionbascarbone.fr`}>{children}</Link>,
            })}
          </Alert>
          <Button loading={downloading} onClick={handleSampleDownload}>
            {t('downloadSample')}
          </Button>
        </div>
      )}

      {selectedDoc ? (
        <div className="flex-col">
          <div className="flex-col mb1">
            <InputLabel>{t('documentSelector')}</InputLabel>
            <div className={classNames(styles.flowButtons, 'flex grow')}>
              <DocumentSelector
                documents={documents}
                selectedDocument={selectedDoc}
                setSelectedDocument={setSelectedDoc}
              />
              <LoadingButton
                aria-label={t('download')}
                title={t('download')}
                onClick={handleDownload}
                loading={downloading}
                iconButton
              >
                <DownloadIcon />
              </LoadingButton>
              <LoadingButton
                aria-label={t('removeDocument')}
                title={t('removeDocument')}
                onClick={handleDelete}
                loading={deleting}
                iconButton
                color="error"
              >
                <DeleteIcon />
              </LoadingButton>
            </div>
          </div>
          <DocumentViewer selectedDocument={selectedDoc} studyId={study.id} />
        </div>
      ) : (
        t('noDocument')
      )}
    </Block>
  )
}

export default StudyDocument
