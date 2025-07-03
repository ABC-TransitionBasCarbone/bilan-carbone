import NotFound from '@/components/pages/NotFound'
import { canDuplicateStudy } from '@/services/permissions/study'
import React from 'react'
import { UserSessionProps } from './withAuth'

export type StudyDuplicationProps = {
  duplicateStudyId: string | null
}

interface Props {
  searchParams: Promise<{ duplicate?: string }>
}

const withStudyDuplication = (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  WrappedComponent: React.ComponentType<any & UserSessionProps & StudyDuplicationProps>,
) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const Component = async (props: any & Props & UserSessionProps) => {
    const searchParams = await props.searchParams
    const duplicateStudyId = searchParams.duplicate ?? null

    if (duplicateStudyId) {
      const canDuplicate = await canDuplicateStudy(duplicateStudyId)
      if (!canDuplicate) {
        return <NotFound />
      }
    }

    return <WrappedComponent {...props} duplicateStudyId={duplicateStudyId} />
  }

  Component.displayName = 'WithStudyDuplication'
  return Component
}

export default withStudyDuplication
