import NotFound from '@/components/pages/NotFound'
import { getStudyById } from '@/db/study'
import { getAccountRoleOnStudy, hasEditionRights } from '@/utils/study'
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
    const duplicateStudyId = searchParams.duplicate

    if (duplicateStudyId) {
      const sourceStudy = await getStudyById(duplicateStudyId, props.user.organizationVersionId)
      if (!sourceStudy) {
        return <NotFound />
      }

      const userRole = getAccountRoleOnStudy(props.user, sourceStudy)
      if (!hasEditionRights(userRole)) {
        return <NotFound />
      }
    }

    return <WrappedComponent {...props} duplicateStudyId={duplicateStudyId ?? null} />
  }

  Component.displayName = 'WithStudyDuplication'
  return Component
}

export default withStudyDuplication
