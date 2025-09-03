import Image from '@/components/document/Image'
import PdfViewer from '@/components/document/PDFViewer'
import { getDocumentUrl } from '@/services/serverFunctions/file'
import { Document } from '@prisma/client'
import { useTranslations } from 'next-intl'
import { useEffect, useMemo, useState } from 'react'
import styles from './StudyFlow.module.css'

interface Props {
  selectedDocument: Document
  studyId: string
}

const DocumentViewer = ({ studyId, selectedDocument }: Props) => {
  const t = useTranslations('study.flow')
  const isPdf = useMemo(() => selectedDocument?.type === 'application/pdf', [selectedDocument])
  const [documentUrl, setDocumentUrl] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAndSetDocumentUrl(selectedDocument)
  }, [selectedDocument])

  const fetchAndSetDocumentUrl = async (document: Document) => {
    setLoading(true)
    const url = await getDocumentUrl(document, studyId)
    if (url.success) {
      setDocumentUrl(url.data || '')
    }
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
        <PdfViewer pdfUrl={documentUrl} fileName={selectedDocument.name} />
      ) : (
        <Image
          className={styles.flowImage}
          src={documentUrl}
          alt={selectedDocument.name}
          width={0}
          height={0}
          layout="responsive"
        />
      )}
    </div>
  )
}

export default DocumentViewer
