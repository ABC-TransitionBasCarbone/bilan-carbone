import { FullStudy, getMinimalStudyForRights, getStudyById, MinimalStudyForRights } from '@/db/study'
import { canReadStudy, canReadStudyDetail } from '@/services/permissions/study'
import NotFound from '@abc-transitionbascarbone/components/src/pages/NotFound'
import { redirect } from 'next/navigation'
import React from 'react'
import { UserSessionProps } from './withAuth'

interface Props {
  params: Promise<{
    id: string
  }>
}
export type StudyProps = {
  study: FullStudy
  minimalStudy: MinimalStudyForRights
  studyId: string
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

    const study = await getStudyById(id, props.user.organizationVersionId)
    const minimalStudy = await getMinimalStudyForRights(id)
    if (!study || !minimalStudy) {
      return <NotFound />
    }

    if (!(await canReadStudyDetail(props.user, study))) {
      if (!(await canReadStudy(props.user, study.id))) {
        return <NotFound />
      }
      return redirect(`/etudes/${study.id}/contributeur`)
    }

    return <WrappedComponent {...props} study={study} studyId={study.id} minimalStudy={minimalStudy} />
  }

  Component.displayName = 'WithStudyDetails'
  return Component
}

export default WithStudyDetails
