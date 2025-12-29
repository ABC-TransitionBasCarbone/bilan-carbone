import NotFound from '@/components/pages/NotFound'
import { canDuplicateStudy } from '@/services/permissions/study'
import React from 'react'
import { UserSessionProps } from './withAuth'

export type StudyCreationProps = {
  duplicateStudyId: string | null
  isSimplified: boolean
}

interface Props {
  searchParams: Promise<{ duplicate?: string }>
}

const withStudyCreation = (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  WrappedComponent: React.ComponentType<any & UserSessionProps & StudyCreationProps>,
) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
