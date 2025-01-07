/* eslint-disable @typescript-eslint/no-explicit-any */
import NotFound from '@/components/pages/NotFound'
import { FullStudy, getStudyById } from '@/db/study'
import React from 'react'
import { UserProps } from './withAuth'

export type StudyProps = {
  study: FullStudy
}

interface Props {
  params: Promise<{
    id: string
  }>
}

const withStudy = (WrappedComponent: React.ComponentType<any & UserProps & StudyProps>) => {
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

    return <WrappedComponent {...props} study={study} />
  }

  Component.displayName = 'WithStudy'
  return Component
}

export default withStudy
