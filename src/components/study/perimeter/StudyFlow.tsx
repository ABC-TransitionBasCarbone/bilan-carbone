'use client'

import PdfViewer from '@/components/document/PDFViewer'
import { getDocumentsForStudy } from '@/db/document'
import { FullStudy } from '@/db/study'
import { getDocument } from '@/services/serverFunctions/file'
import { addFlowToStudy, deleteFlowFromStudy } from '@/services/serverFunctions/study'
import DeleteIcon from '@mui/icons-material/Delete'
import { InputLabel, MenuItem, Button as MUIButton, Select } from '@mui/material'
import { Document } from '@prisma/client'
import { useTranslations } from 'next-intl'
import { useEffect, useState } from 'react'
import Block from '../../base/Block'
import styles from './StudyFlow.module.css'

interface Props {
  study: FullStudy
}

const StudyFlow = ({ study }: Props) => {
  const t = useTranslations('study.perimeter')
  const [pdfUrl, setPdfUrl] = useState<string | undefined>(undefined)
  const [documents, setDocuments] = useState<Document[]>([])
  const [selectedFlow, setSelectedFlow] = useState<Document | undefined>(undefined)

  useEffect(() => {
    fetchDocuments(true)
  }, [])

  useEffect(() => {
    if (!selectedFlow) {
      setPdfUrl(undefined)
    } else {
      fetchAndSetPdfUrl(selectedFlow.bucketKey)
    }
  }, [selectedFlow])

  const fetchDocuments = async (init: boolean = false) => {
    const documents = await getDocumentsForStudy(study.id)
    setDocuments(documents)
    if (init) {
      setSelectedFlow(documents[0])
    }
  }

  const fetchAndSetPdfUrl = async (bucketKey: string) => {
    const url = await getDocument(bucketKey)
    setPdfUrl(url)
  }

  const addFlow = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) {
      return
    }
    await addFlowToStudy(file, study.id)
    fetchDocuments(documents.length === 0)
  }

  const removeDocument = async () => {
    if (!selectedFlow) {
      return
    }
    await deleteFlowFromStudy(selectedFlow, study.id)
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
                accept="application/pdf"
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
            <div className="flex grow">
              <Select
                className="grow mr1"
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
          <PdfViewer pdfUrl={pdfUrl} fileName={selectedFlow.name} />
        </div>
      ) : (
        t('noFlows')
      )}
    </Block>
  )
}

export default StudyFlow
