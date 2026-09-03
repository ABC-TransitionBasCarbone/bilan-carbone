import { FullStudy, getStudyById, getStudyWithReadRights, StudyWithReadRights } from '@/db/study'
import { canReadStudy, canReadStudyDetail } from '@/services/permissions/study'
import { getAccountRoleOnStudy } from '@/utils/study'
import NotFound from '@abc-transitionbascarbone/components/src/pages/NotFound'
import { StudyRole } from '@abc-transitionbascarbone/db-common/enums'
import { redirect } from 'next/navigation'
import React from 'react'
import { UserSessionProps } from './withAuth'

export type StudyProps = {
  studyId: string
  userStudyRole: StudyRole
  studyOrganizationVersion: StudyWithReadRights['organizationVersion']
  study: FullStudy //TODO : remove at the end of refacto
  studyName: string
}

interface Props {
  params: Promise<{
    id: string
  }>
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const WithStudyDetails = (WrappedComponent: React.ComponentType<any & UserSessionProps & StudyProps>) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const Component = async (props: any & Props & UserSessionProps) => {
    const params = await props.params
    const id = params.id
    if (!id) {
      return <NotFound />
    }

    const fullStudy = await getStudyById(id, props.user.organizationVersionId)
    if (!fullStudy) {
      return <NotFound />
    }
    const study = await getStudyWithReadRights(id, props.user.organizationVersionId)
    if (!study) {
      return <NotFound />
    }

    if (!(await canReadStudyDetail(props.user, study))) {
      if (!(await canReadStudy(props.user, study.id))) {
        return <NotFound />
      }
      return redirect(`/etudes/${study.id}/contributeur`)
    }

    const userStudyRole = getAccountRoleOnStudy(props.user, study)
    if (!userStudyRole) {
      return <NotFound />
    }

    return (
      <WrappedComponent
        {...props}
        studyId={study.id}
        userRole={userStudyRole}
        studyOrganizationVersion={study.organizationVersion}
        study={fullStudy}
        studyName={study.name}
      />
    )
  }

  Component.displayName = 'WithStudyDetails'
  return Component
}

export default WithStudyDetails
