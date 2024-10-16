import StudyPage from '@/components/pages/Study'
import { getStudyByUser } from '@/db/study'
import { auth } from '@/services/auth'
import React from 'react'

const Study = async () => {
  const session = await auth()
  if (!session) {
    return null
  }

  const studies = await getStudyByUser(session.user)

  return <StudyPage studies={studies}></StudyPage>
}

export default Study
