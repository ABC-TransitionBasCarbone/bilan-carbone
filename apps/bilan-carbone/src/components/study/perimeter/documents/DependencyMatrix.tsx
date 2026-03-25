'use client'

import { FullStudy } from '@/db/study'
import { DocumentCategory } from '@repo/db-common/enums'
import { Document} from '@repo/db-common'
import { useTranslations } from 'next-intl'
import StudyDocument from './StudyDocument'

interface Props {
  documents: Document[]
  study: FullStudy
}

const DependencyMatrix = ({ documents, study }: Props) => {
  const t = useTranslations('study.dependencyMatrix')

  return (
    <StudyDocument
      title={t('dependencyMatrices', { name: study.name })}
      t={t}
      study={study}
      documents={documents}
      documentCategory={DocumentCategory.DependencyMatrix}
    />
  )
}

export default DependencyMatrix
