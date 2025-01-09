import NotFound from '@/components/pages/NotFound'
import { getStudyById } from '@/db/study'
import { canReadStudy, canReadStudyDetail } from '@/services/permissions/study'
import { redirect } from 'next/navigation'
import React from 'react'
import { UserProps } from './withAuth'
import { StudyProps } from './withStudy'

interface Props {
  params: Promise<{
    id: string
  }>
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const WithStudyDetails = (WrappedComponent: React.ComponentType<any & UserProps & StudyProps>) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const Component = async (props: any & Props & UserProps) => {
    const params = await props.params
    const id = params.id
    if (!id) {
      return <NotFound />
    }

    const study = await getStudyById(id, props.user.organizationId)
    if (!study) {
      return <NotFound />
    }

    if (!(await canReadStudyDetail(props.user, study))) {
      if (!(await canReadStudy(props.user, study))) {
        return <NotFound />
      }
      return redirect(`/etudes/${study.id}/contributeur`)
    }

    return <WrappedComponent {...props} study={study} />
  }

  Component.displayName = 'WithStudyDetails'
  return Component
}

export default WithStudyDetails
