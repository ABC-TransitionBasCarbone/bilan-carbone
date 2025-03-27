import NotFound from '@/components/pages/NotFound'
import { FullStudy, getStudyById } from '@/db/study'
import React from 'react'
import { UserSessionProps } from './withAuth'

export type StudyProps = {
  study: FullStudy
}

interface Props {
  params: Promise<{
    id: string
  }>
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const withStudy = (WrappedComponent: React.ComponentType<any & UserSessionProps & StudyProps>) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const Component = async (props: any & Props & UserSessionProps) => {
    const params = await props.params
    const id = params.id
    if (!id) {
      return <NotFound />
    }

    const study = await getStudyById(id, props.user.organizationId)
    if (!study) {
      return <NotFound />
    }

    return <WrappedComponent {...props} study={study} />
  }

  Component.displayName = 'WithStudy'
  return Component
}

export default withStudy
