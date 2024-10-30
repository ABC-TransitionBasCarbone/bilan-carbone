import NotFound from '@/components/study/NotFound'
import NewStudyRightPage from '@/components/pages/NewStudyRight'
import { getStudyWithRightsById } from '@/db/study'
import { auth } from '@/services/auth'
import { UUID } from 'crypto'
import React from 'react'
import { canReadStudy } from '@/services/permissions/study'

interface Props {
  params: {
    id: UUID
  }
}

const NewStudyRight = async ({ params }: Props) => {
  const session = await auth()

  const id = params.id
  if (!id || !session) {
    return <NotFound />
  }

  const study = await getStudyWithRightsById(id)

  if (!study) {
    return <NotFound />
  }

  if (!(await canReadStudy(session.user, study))) {
    return <NotFound />
  }
  return <NewStudyRightPage study={study} user={session.user} />
}

export default NewStudyRight
