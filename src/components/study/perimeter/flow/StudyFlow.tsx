'use client'

import Button from '@/components/base/Button'
import { getDocumentsForStudy } from '@/db/document'
import { FullStudy } from '@/db/study'
import { allowedFlowFileTypes, downloadFromUrl } from '@/services/file'
import { getDocumentUrl } from '@/services/serverFunctions/file'
import { addFlowToStudy, deleteFlowFromStudy } from '@/services/serverFunctions/study'
import DeleteIcon from '@mui/icons-material/Delete'
import DownloadIcon from '@mui/icons-material/Download'
import { InputLabel, Button as MUIButton } from '@mui/material'
import { Document } from '@prisma/client'
import classNames from 'classnames'
import { useTranslations } from 'next-intl'
import { useEffect, useState } from 'react'
import Block from '../../../base/Block'
import FlowSelector from './FlowSelector'
import styles from './StudyFlow.module.css'
import StudyFlowViewer from './StudyFlowViewer'

interface Props {
  study: FullStudy
}

const StudyFlow = ({ study }: Props) => {
  const t = useTranslations('study.flow')
  const [selectedFlow, setSelectedFlow] = useState<Document | undefined>(undefined)
  const [documents, setDocuments] = useState<Document[]>([])
  const [error, setError] = useState('')

  useEffect(() => {
    fetchDocuments()
  }, [])

  const fetchDocuments = async (init = true) => {
    const documents = await getDocumentsForStudy(study.id)
    setDocuments(documents || [])
    if (init) {
      setSelectedFlow(documents[0])
    }
  }

  const addFlow = async (files: FileList | null) => {
    setError('')
    const result = await addFlowToStudy(study.id, files?.[0])
    if (result) {
      setError(result)
      return
    }
    fetchDocuments(documents.length === 0)
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
      setError(result)
      return
    }
    fetchDocuments()
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
                accept={allowedFlowFileTypes.join(',')}
                onChange={(event) => {
                  addFlow(event.target.files)
                  event.target.value = ''
                }}
              />
            </div>
          ),
        },
      ]}
    >
      {error && <div className={classNames(styles.error, 'mb1')}>{t(error)}</div>}
      {selectedFlow ? (
        <div className="flex-col">
          <div className="flex-col mb1">
            <InputLabel id="flow-selector-label">{t('flowSelector')}</InputLabel>
            <div className={classNames(styles.flowButtons, 'flex grow')}>
              <FlowSelector documents={documents} selectedFlow={selectedFlow} setSelectedFlow={setSelectedFlow} />
              <Button data-testid="flow-mapping-download" onClick={downloadDocument}>
                <DownloadIcon />
              </Button>
              <MUIButton
                data-testid="flow-mapping-delete"
                onClick={removeDocument}
                variant="contained"
                color="error"
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
