'use client'

import { FullStudy } from '@/db/study'
import { Document, DocumentCategory } from '@prisma/client'
import { useTranslations } from 'next-intl'
import StudyDocument from './StudyDocument'

interface Props {
  documents: Document[]
  initialDocument?: Document
  study: FullStudy
}

const DependencyMatrix = ({ documents, initialDocument, study }: Props) => {
  const t = useTranslations('study.dependencyMatrix')

  return (
    <StudyDocument
      title={t('dependencyMatrices', { name: study.name })}
      t={t}
      study={study}
      documents={documents}
      initialDocument={initialDocument}
      documentCategory={DocumentCategory.DependencyMatrix}
    />
  )
}

export default DependencyMatrix
