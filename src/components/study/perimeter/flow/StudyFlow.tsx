'use client'

import Button from '@/components/base/Button'
import LoadingButton from '@/components/base/LoadingButton'
import { useToast } from '@/components/base/ToastProvider'
import { FullStudy } from '@/db/study'
import { useServerFunction } from '@/hooks/useServerFunction'
import { allowedFlowFileTypes, downloadFromUrl, maxAllowedFileSize, MB } from '@/services/file'
import { hasAccessToStudyFlowExample } from '@/services/permissions/environment'
import { getDocumentUrl } from '@/services/serverFunctions/file'
import { addFlowToStudy, deleteFlowFromStudy } from '@/services/serverFunctions/study'
import { getStudyFlowSampleDocumentUrl } from '@/services/serverFunctions/studyFlow'
import { useAppEnvironmentStore } from '@/store/AppEnvironment'
import DeleteIcon from '@mui/icons-material/Delete'
import DownloadIcon from '@mui/icons-material/Download'
import { Alert, InputLabel } from '@mui/material'
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
  canAddFlow: boolean
  documents: Document[]
  initialDocument?: Document
  study: FullStudy
}

const StudyFlow = ({ canAddFlow, documents, initialDocument, study }: Props) => {
  const t = useTranslations('study.flow')
  const tUpload = useTranslations('upload')
  const { callServerFunction } = useServerFunction()
  const { showErrorToast } = useToast()
  const { environment } = useAppEnvironmentStore()

  const router = useRouter()
  const [uploading, setUploading] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [selectedFlow, setSelectedFlow] = useState<Document | undefined>(initialDocument)

  useEffect(() => {
    setSelectedFlow(initialDocument)
  }, [initialDocument])

  const addFlow = async (event: React.ChangeEvent<HTMLInputElement>) => {
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
    await callServerFunction(() => addFlowToStudy(study.id, file), {
      getErrorMessage: (error) => t(error),
      onSuccess: () => {
        router.refresh()
      },
    })
    setUploading(false)
  }

  const downloadDocument = async () => {
    if (!selectedFlow) {
      return
    }
    setDownloading(true)
    await callServerFunction(() => getDocumentUrl(selectedFlow, study.id), {
      getErrorMessage: (error) => t(error),
      onSuccess: (url) => {
        downloadFromUrl(url, selectedFlow.name)
      },
    })
    setDownloading(false)
  }

  const removeDocument = async () => {
    if (!selectedFlow) {
      return
    }
    setDeleting(true)
    await callServerFunction(() => deleteFlowFromStudy(selectedFlow, study.id), {
      getErrorMessage: (error) => t(error),
      onSuccess: () => {
        router.refresh()
      },
    })
    setDeleting(false)
  }

  const downloadSample = async () => {
    setDownloading(true)
    await callServerFunction(() => getStudyFlowSampleDocumentUrl(study.id), {
      getErrorMessage: (error) => t(error),
      onSuccess: (url) => {
        downloadFromUrl(url, 'example_study_flow.jpg')
      },
    })
    setDownloading(false)
  }

  return (
    <Block
      title={t('flows', { name: study.name })}
      as="h1"
      actions={
        canAddFlow
          ? [
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
            ]
          : undefined
      }
    >
      {environment && hasAccessToStudyFlowExample(environment) && (
        <div className="mb-2">
          <Alert severity="info" className="mb-2">
            {t('info')}
          </Alert>
          <Button loading={downloading} onClick={downloadSample}>
            {t('downloadSample')}
          </Button>
        </div>
      )}

      {selectedFlow ? (
        <div className="flex-col">
          <div className="flex-col mb1">
            <InputLabel id="flow-selector-label">{t('flowSelector')}</InputLabel>
            <div className={classNames(styles.flowButtons, 'flex grow')}>
              <FlowSelector documents={documents} selectedFlow={selectedFlow} setSelectedFlow={setSelectedFlow} />
              <LoadingButton
                aria-label={t('download')}
                title={t('download')}
                data-testid="flow-mapping-download"
                onClick={downloadDocument}
                loading={downloading}
                iconButton
              >
                <DownloadIcon />
              </LoadingButton>
              <LoadingButton
                aria-label={t('removeFlow')}
                title={t('removeFlow')}
                data-testid="flow-mapping-delete"
                onClick={removeDocument}
                loading={deleting}
                iconButton
                color="error"
              >
                <DeleteIcon />
              </LoadingButton>
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
