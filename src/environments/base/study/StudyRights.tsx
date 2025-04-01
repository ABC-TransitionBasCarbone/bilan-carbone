import StudyContributorsTable from '@/components/study/rights/StudyContributorsTable'
import StudyParams from '@/components/study/rights/StudyParams'
import StudyRightsTable from '@/components/study/rights/StudyRightsTable'
import { FullStudy } from '@/db/study'
import { StudyRole } from '@prisma/client'
import { User } from 'next-auth'

interface Props {
  user: User
  study: FullStudy
  editionDisabled: boolean
  userRoleOnStudy: StudyRole
}

const StudyRights = ({ user, study, editionDisabled, userRoleOnStudy }: Props) => {
  return (
    <>
      <StudyParams user={user} study={study} disabled={editionDisabled} />

      <StudyRightsTable study={study} user={user} canAddMember={!editionDisabled} userRoleOnStudy={userRoleOnStudy} />
      <StudyContributorsTable study={study} canAddContributor={!editionDisabled} />
    </>
  )
}

export default StudyRights
