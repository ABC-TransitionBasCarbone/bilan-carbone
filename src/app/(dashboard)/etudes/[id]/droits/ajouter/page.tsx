import React from 'react'
import { UUID } from 'crypto'
import { getStudyById } from '@/db/study'
import { auth } from '@/services/auth'
import { canReadStudyDetail } from '@/services/permissions/study'
import NotFound from '@/components/pages/NotFound'
import NewStudyRightPage from '@/components/pages/NewStudyRight'

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

  const study = await getStudyById(id)

  if (!study) {
    return <NotFound />
  }

  if (!(await canReadStudyDetail(session.user, study))) {
    return <NotFound />
  }

  return <NewStudyRightPage study={study} user={session.user} />
}

export default NewStudyRight
