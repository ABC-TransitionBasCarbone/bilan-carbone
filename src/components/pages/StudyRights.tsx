import React from 'react'
import { User } from 'next-auth'
import { StudyWithRights } from '@/db/study'
import StudyRightsTable from '../study/rights/StudyRightsTable'

interface Props {
  study: StudyWithRights
  user: User
}

const StudyRightsPage = ({ study, user }: Props) => {
  return <StudyRightsTable study={study} user={user} />
}

export default StudyRightsPage
