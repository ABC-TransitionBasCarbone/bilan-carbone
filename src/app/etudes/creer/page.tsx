import NewStudyPage from '@/components/pages/newStudy'
import { getUserOrganizations } from '@/db/user'
import { auth } from '@/services/auth'
import React from 'react'

const NewStudy = async () => {
  const session = await auth()
  if (!session) {
    return null
  }

  const organizations = await getUserOrganizations(session.user.email)

  return <NewStudyPage organizations={organizations}></NewStudyPage>
}

export default NewStudy
