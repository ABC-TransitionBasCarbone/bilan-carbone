'use client'

import PdfViewer from '@/components/document/PDFViewer'
import { Document } from '@prisma/client'

interface Props {
  document: Document
}

const StudyFlow = ({ document }: Props) => {
  return <PdfViewer fileKey={document.bucketKey} />
}

export default StudyFlow
