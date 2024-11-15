import StudyRightsPage from '@/components/pages/StudyRights'
import NotFound from '@/components/pages/NotFound'
import { getStudyById } from '@/db/study'
import { auth } from '@/services/auth'
import { canReadStudyDetail } from '@/services/permissions/study'
import { UUID } from 'crypto'
import React from 'react'

interface Props {
  params: {
    id: UUID
  }
}

export const revalidate = 0

const StudyRights = async ({ params }: Props) => {
  const session = await auth()

  const id = params.id
  if (!id || !session) {
    return <NotFound />
  }

  const study = await getStudyById(id)

  if (!study) {
    return <NotFound />
  }

  if (!(await canReadStudyDetail(session.user, study))) {
    return <NotFound />
  }

  return <StudyRightsPage study={study} user={session.user} />
}

export default StudyRights
