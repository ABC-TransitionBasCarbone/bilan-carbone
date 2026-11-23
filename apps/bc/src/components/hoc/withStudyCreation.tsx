import { canDuplicateStudy } from '@/services/permissions/study'
import NotFound from '@abc-transitionbascarbone/common/components/pages/NotFound'
import React from 'react'
import { UserSessionProps } from './withAuth'

export type StudyCreationProps = {
  duplicateStudyId: string | null
  isSimplified: boolean
}

interface Props {
  searchParams: Promise<{ duplicate?: string }>
}

const withStudyCreation = (WrappedComponent: React.ComponentType<any & UserSessionProps & StudyCreationProps>) => {
  const Component = async (props: any & Props & UserSessionProps) => {
    const searchParams = await props.searchParams
    const duplicateStudyId = searchParams.duplicate ?? null
    const isSimplified = searchParams.simplified === 'true'

    if (duplicateStudyId) {
      const canDuplicate = await canDuplicateStudy(duplicateStudyId)
      if (!canDuplicate) {
        return <NotFound />
      }
    }

    return <WrappedComponent {...props} duplicateStudyId={duplicateStudyId} isSimplified={isSimplified} />
  }

  Component.displayName = 'WithStudyCreation'
  return Component
}

export default withStudyCreation
