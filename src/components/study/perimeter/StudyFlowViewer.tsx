'use client'

import PdfViewer from '@/components/document/PDFViewer'
import { Document } from '@prisma/client'
import { useTranslations } from 'next-intl'
import Image from 'next/image'
import { useEffect, useMemo, useState } from 'react'
import styles from './StudyFlow.module.css'

interface Props {
  selectedFlow: Document
  documentUrl?: string
}

const StudyFlowViewer = ({ documentUrl, selectedFlow }: Props) => {
  const [width, setWidth] = useState(0)
  const [height, setHeight] = useState(0)
  const t = useTranslations('study.perimeter')

  const setDimensions = async (src: string) => {
    const image = new window.Image()
    image.onload = () => {
      setWidth(image.width)
      setHeight(image.height)
    }
    image.src = src
  }

  useEffect(() => {
    if (documentUrl) {
      setDimensions(documentUrl)
    }
  }, [documentUrl])

  const isPdf = useMemo(() => selectedFlow?.type === 'application/pdf', [selectedFlow])

  if (!documentUrl) {
    return <div>{t('documentNotFound')}</div>
  }

  return (
    <div className="flex-cc">
      {isPdf ? (
        <PdfViewer pdfUrl={documentUrl} fileName={selectedFlow.name} />
      ) : (
        <Image className={styles.flowImage} src={documentUrl} alt={selectedFlow.name} width={width} height={height} />
      )}
    </div>
  )
}

export default StudyFlowViewer
