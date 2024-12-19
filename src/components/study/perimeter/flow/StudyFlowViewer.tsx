import ImageViewer from '@/components/document/ImageViewer'
import PdfViewer from '@/components/document/PDFViewer'
import { getDocumentUrl } from '@/services/serverFunctions/file'
import { Document } from '@prisma/client'
import { useTranslations } from 'next-intl'
import { useEffect, useMemo, useState } from 'react'
import styles from './StudyFlow.module.css'

interface Props {
  selectedFlow: Document
  studyId: string
}

const StudyFlowViewer = ({ studyId, selectedFlow }: Props) => {
  const t = useTranslations('study.flow')
  const isPdf = useMemo(() => selectedFlow?.type === 'application/pdf', [selectedFlow])
  const [documentUrl, setDocumentUrl] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAndSetFlowUrl(selectedFlow)
  }, [selectedFlow])

  const fetchAndSetFlowUrl = async (document: Document) => {
    setLoading(true)
    const url = await getDocumentUrl(document, studyId)
    setDocumentUrl(url || '')
    setLoading(false)
  }

  if (loading) {
    return <p>{t('loading')}</p>
  }

  if (!documentUrl) {
    return <p>{t('documentNotFound')}</p>
  }

  return (
    <div className="flex-cc">
      {isPdf ? (
        <PdfViewer pdfUrl={documentUrl} fileName={selectedFlow.name} />
      ) : (
        <ImageViewer url={documentUrl} alt={selectedFlow.name} className={styles.flowImage} />
      )}
    </div>
  )
}

export default StudyFlowViewer
