import { FullStudy, getMinimalStudyForRights, getStudyById } from '@/db/study'
import { canReadStudy, canReadStudyDetail } from '@/services/permissions/study'
import NotFound from '@abc-transitionbascarbone/components/src/pages/NotFound'
import React from 'react'
import { UserSessionProps } from './withAuth'

interface Props {
  params: Promise<{
    id: string
  }>
}
export type StudyProps = {
  study: FullStudy
  studyId: string
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const WithStudyContributors = (WrappedComponent: React.ComponentType<any & UserSessionProps & StudyProps>) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const Component = async (props: any & Props & UserSessionProps) => {
    const params = await props.params
    const id = params.id
    if (!id) {
      return <NotFound />
    }

    const study = await getStudyById(id, props.user.organizationVersionId)
    const minimalStudy = await getMinimalStudyForRights(id)
    if (!study || !minimalStudy) {
      return <NotFound />
    }

    if (!(await canReadStudyDetail(props.user, study)) && !(await canReadStudy(props.user, study.id))) {
      return <NotFound />
    }

    return <WrappedComponent {...props} study={study} studyId={study.id} />
  }

  Component.displayName = 'WithStudyContributors'
  return Component
}

export default WithStudyContributors
