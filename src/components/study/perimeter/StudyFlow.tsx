'use client'

import Button from '@/components/base/Button'
import { getDocumentsForStudy } from '@/db/document'
import { FullStudy } from '@/db/study'
import { allowedFlowFileTypes, downloadFromUrl, isAllowedFileType } from '@/services/file'
import { NOT_AUTHORIZED } from '@/services/permissions/check'
import { getDocumentUrl } from '@/services/serverFunctions/file'
import { addFlowToStudy, deleteFlowFromStudy } from '@/services/serverFunctions/study'
import DeleteIcon from '@mui/icons-material/Delete'
import DownloadIcon from '@mui/icons-material/Download'
import { InputLabel, MenuItem, Button as MUIButton, Select } from '@mui/material'
import { Document } from '@prisma/client'
import classNames from 'classnames'
import { useTranslations } from 'next-intl'
import { useEffect, useState } from 'react'
import Block from '../../base/Block'
import styles from './StudyFlow.module.css'
import StudyFlowViewer from './StudyFlowViewer'

interface Props {
  study: FullStudy
}

const StudyFlow = ({ study }: Props) => {
  const t = useTranslations('study.perimeter')
  const [error, setError] = useState<string | undefined>(undefined)
  const [documentUrl, setDocumentUrl] = useState<string | undefined>(undefined)
  const [documents, setDocuments] = useState<Document[]>([])
  const [selectedFlow, setSelectedFlow] = useState<Document | undefined>(undefined)

  useEffect(() => {
    fetchDocuments(true)
  }, [])

  useEffect(() => {
    if (!selectedFlow) {
      setDocumentUrl(undefined)
    } else {
      fetchAndSetFlowUrl(selectedFlow)
    }
  }, [selectedFlow])

  const fetchDocuments = async (init: boolean = false) => {
    const documents = await getDocumentsForStudy(study.id)
    setDocuments(documents)
    if (init) {
      setSelectedFlow(documents[0])
    }
  }

  const fetchAndSetFlowUrl = async (document: Document) => {
    const url = await getDocumentUrl(document, study.id)
    if (url === NOT_AUTHORIZED) {
      return
    }
    setDocumentUrl(url)
  }

  const addFlow = async (event: React.ChangeEvent<HTMLInputElement>) => {
    setError(undefined)
    const file = event.target.files?.[0]
    if (!file) {
      setError('noFileSelected')
      return
    }
    const allowedType = await isAllowedFileType(file, allowedFlowFileTypes)
    if (!allowedType) {
      setError('invalidFileType')
      return
    }
    const res = await addFlowToStudy(file, study.id)
    if (res === NOT_AUTHORIZED) {
      setError('notAuthorized')
      return
    }
    fetchDocuments(documents.length === 0)
  }

  const downloadDocument = async () => {
    if (!selectedFlow || !documentUrl) {
      return
    }
    downloadFromUrl(documentUrl, selectedFlow.name)
  }

  const removeDocument = async () => {
    setError(undefined)
    if (!selectedFlow) {
      return
    }
    const res = await deleteFlowFromStudy(selectedFlow, study.id)
    if (res === NOT_AUTHORIZED) {
      setError('notAuthorized')
      return
    }
    fetchDocuments(true)
  }

  return (
    <Block
      title={t('flows', { name: study.name })}
      as="h1"
      actions={[
        {
          actionType: 'button',
          onClick: () => document.getElementById('flow-upload-input')?.click(),
          children: (
            <div className="align-center">
              {t('addFlow')}
              <input
                id="flow-upload-input"
                className={styles.flowUploadButton}
                type="file"
                accept={allowedFlowFileTypes.join(',')}
                onChange={addFlow}
              />
            </div>
          ),
        },
      ]}
    >
      {documents.length > 0 && selectedFlow ? (
        <div className="flex-col">
          <div className="flex-col mb1">
            <InputLabel id="local-selector-label">{t('flowSelector')}</InputLabel>
            <div className={classNames(styles.flowButtons, 'flex grow')}>
              <Select
                className="grow"
                value={selectedFlow.id}
                aria-labelledby="local-selector-label"
                onChange={(event) => setSelectedFlow(documents.find((flow) => flow.id === event.target.value))}
                disabled={documents.length === 1}
              >
                {Object.values(documents).map((document) => (
                  <MenuItem key={document.id} value={document.id}>
                    {document.name}
                  </MenuItem>
                ))}
              </Select>
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
          {error && <div className={classNames(styles.error, 'mb1')}>{t(error)}</div>}
          <StudyFlowViewer documentUrl={documentUrl} selectedFlow={selectedFlow} />
        </div>
      ) : (
        t('noFlows')
      )}
    </Block>
  )
}

export default StudyFlow
