import NewStudyPage from '@/components/pages/NewStudy'
import { getUserOrganizations } from '@/db/user'
import { auth } from '@/services/auth'
import React from 'react'

const NewStudy = async () => {
  const session = await auth()
  if (!session) {
    return null
  }

  const organizations = await getUserOrganizations(session.user.email)

  return <NewStudyPage organizations={organizations} user={session.user} />
}

export default NewStudy
