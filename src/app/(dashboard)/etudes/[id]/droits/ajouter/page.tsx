import React from 'react'
import { UUID } from 'crypto'
import { getOrganizationUsers } from '@/db/organization'
import { getStudyById } from '@/db/study'
import { auth } from '@/services/auth'
import { canReadStudy } from '@/services/permissions/study'
import NotFound from '@/components/study/NotFound'
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

  if (!(await canReadStudy(session.user, study))) {
    return <NotFound />
  }

  const users = await getOrganizationUsers(session.user.organizationId)
  const existingUsers = study.allowedUsers.map((allowedUser) => allowedUser.user.email)
  const userEmails = users.filter((user) => !existingUsers.includes(user.email)).map((user) => user.email)

  return <NewStudyRightPage study={study} user={session.user} usersEmail={userEmails} />
}

export default NewStudyRight
