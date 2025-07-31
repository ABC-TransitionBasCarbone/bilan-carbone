'use client'

import Button from '@/components/base/Button'
import LoadingButton from '@/components/base/LoadingButton'
import { useToast } from '@/components/base/ToastProvider'
import { FullStudy } from '@/db/study'
import { useServerFunction } from '@/hooks/useServerFunction'
import { allowedFlowFileTypes, downloadFromUrl, maxAllowedFileSize, MB } from '@/services/file'
import { getDocumentUrl } from '@/services/serverFunctions/file'
import { addDocumentToStudy, deleteDocumentFromStudy } from '@/services/serverFunctions/study'
import { getDependencyMatrixSampleDocumentUrl } from '@/services/serverFunctions/studyFlow'
import DeleteIcon from '@mui/icons-material/Delete'
import DownloadIcon from '@mui/icons-material/Download'
import { Alert, InputLabel } from '@mui/material'
import { Document, DocumentCategory } from '@prisma/client'
import classNames from 'classnames'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Block from '../../../base/Block'
import DocumentSelector from './DocumentSelector'
import DocumentViewer from './DocumentViewer'
import styles from './StudyFlow.module.css'

interface Props {
  documents: Document[]
  initialDocument?: Document
  study: FullStudy
}

const DependencyMatrix = ({ documents, initialDocument, study }: Props) => {
  const t = useTranslations('study.dependencyMatrix')
  const tUpload = useTranslations('upload')
  const { callServerFunction } = useServerFunction()
  const { showErrorToast } = useToast()

  const router = useRouter()
  const [uploading, setUploading] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [selectedMatrix, setSelectedMatrix] = useState<Document | undefined>(initialDocument)

  useEffect(() => {
    setSelectedMatrix(initialDocument)
  }, [initialDocument])

  const addMatrix = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) {
      showErrorToast(tUpload('noFileSelected'))
      return
    }
    if (file.size > maxAllowedFileSize) {
      showErrorToast(tUpload('fileTooBig', { size: maxAllowedFileSize / MB }))
      return
    }

    setUploading(true)
    await callServerFunction(() => addDocumentToStudy(study.id, file, DocumentCategory.DependencyMatrix), {
      getErrorMessage: (error) => t(error),
      onSuccess: () => {
        router.refresh()
      },
    })
    setUploading(false)
  }

  const downloadDocument = async () => {
    if (!selectedMatrix) {
      return
    }
    setDownloading(true)
    await callServerFunction(() => getDocumentUrl(selectedMatrix, study.id), {
      getErrorMessage: (error) => t(error),
      onSuccess: (url) => {
        downloadFromUrl(url, selectedMatrix.name)
      },
    })
    setDownloading(false)
  }

  const removeDocument = async () => {
    if (!selectedMatrix) {
      return
    }
    setDeleting(true)
    await callServerFunction(() => deleteDocumentFromStudy(selectedMatrix, study.id), {
      getErrorMessage: (error) => t(error),
      onSuccess: () => {
        router.refresh()
      },
    })
    setDeleting(false)
  }

  const downloadSample = async () => {
    setDownloading(true)
    await callServerFunction(() => getDependencyMatrixSampleDocumentUrl(), {
      getErrorMessage: (error) => t(error),
      onSuccess: (url) => {
        downloadFromUrl(url, 'example_dependency_matrix.jpg')
      },
    })
    setDownloading(false)
  }

  return (
    <Block
      title={t('dependencyMatrices', { name: study.name })}
      as="h1"
      actions={[
        {
          actionType: 'loadingButton',
          component: 'label',
          role: undefined,
          variant: 'contained',
          tabIndex: -1,
          loading: uploading,
          children: (
            <div className="align-center">
              {t('add')}
              <input
                id="matrix-upload-input"
                className={styles.flowUploadButton}
                type="file"
                value=""
                accept={allowedFlowFileTypes.join(',')}
                onChange={addMatrix}
              />
            </div>
          ),
        },
      ]}
    >
      <div className="mb-2">
        <Alert severity="info" className="mb-2">
          {t.rich('info', {
            mail: (children) => <Link href={`mailto:methodologie@abc-transitionbascarbone.fr`}>{children}</Link>,
          })}
        </Alert>
        <Button loading={downloading} onClick={downloadSample}>
          {t('downloadSample')}
        </Button>
      </div>
      {selectedMatrix ? (
        <div className="flex-col">
          <div className="flex-col mb1">
            <InputLabel id="matrix-selector-label">{t('dependencyMatrixSelector')}</InputLabel>
            <div className={classNames(styles.flowButtons, 'flex grow')}>
              <DocumentSelector
                documents={documents}
                selectedDocument={selectedMatrix}
                setSelectedDocument={setSelectedMatrix}
              />
              <LoadingButton
                aria-label={t('download')}
                title={t('download')}
                data-testid="matrix-mapping-download"
                onClick={downloadDocument}
                loading={downloading}
                iconButton
              >
                <DownloadIcon />
              </LoadingButton>
              <LoadingButton
                aria-label={t('removeDependencyMatrix')}
                title={t('removeDependencyMatrix')}
                data-testid="matrix-mapping-delete"
                onClick={removeDocument}
                loading={deleting}
                iconButton
                color="error"
              >
                <DeleteIcon />
              </LoadingButton>
            </div>
          </div>
          <DocumentViewer selectedDocument={selectedMatrix} studyId={study.id} />
        </div>
      ) : (
        t('noMatrix')
      )}
    </Block>
  )
}

export default DependencyMatrix
