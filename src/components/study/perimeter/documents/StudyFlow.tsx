'use client'

import { FullStudy } from '@/db/study'
import { Document } from '@prisma/client'
import { useTranslations } from 'next-intl'
import StudyDocument from './StudyDocument'

interface Props {
  canAddFlow: boolean
  documents: Document[]
  initialDocument?: Document
  study: FullStudy
}

const StudyFlow = ({ canAddFlow, documents, initialDocument, study }: Props) => {
  const t = useTranslations('study.flow')

  return (
    <StudyDocument
      title={t('flows', { name: study.name })}
      t={t}
      study={study}
      documents={documents}
      initialDocument={initialDocument}
      canUpload={canAddFlow}
    />
  )
}

export default StudyFlow
