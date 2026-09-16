import { getMinimalStudyForRights, MinimalStudyForRights } from '@/db/study'
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
export type NEWStudyProps = {
  minimalStudy: MinimalStudyForRights
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const NEWWithStudyDetails = (WrappedComponent: React.ComponentType<any & UserSessionProps & NEWStudyProps>) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const Component = async (props: any & Props & UserSessionProps) => {
    const params = await props.params
    const id = params.id
    if (!id) {
      return <NotFound />
    }

    const minimalStudy = await getMinimalStudyForRights(id)
    if (!minimalStudy) {
      return <NotFound />
    }

    if (!(await canReadStudyDetail(props.user, minimalStudy))) {
      if (!(await canReadStudy(props.user, minimalStudy.id))) {
        return <NotFound />
      }
      return redirect(`/etudes/${minimalStudy.id}/contributeur`)
    }

    return <WrappedComponent {...props} minimalStudy={minimalStudy} />
  }

  Component.displayName = 'NEWWithStudyDetails'
  return Component
}

export default NEWWithStudyDetails
