import NotFound from '@/components/pages/NotFound'
import NewStudyContributorPage from '@/components/pages/NewStudyContributor'
import { getStudyById } from '@/db/study'
import { auth } from '@/services/auth'
import { UUID } from 'crypto'
import React from 'react'
import { canReadStudyDetail } from '@/services/permissions/study'

interface Props {
  params: {
    id: UUID
  }
}

const NewStudyContributor = async ({ params }: Props) => {
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
  return <NewStudyContributorPage study={study} />
}

export default NewStudyContributor
