import StudyContributorsTable from '@/components/study/rights/StudyContributorsTable'
import StudyParams from '@/components/study/rights/StudyParams'
import StudyRightsTable from '@/components/study/rights/StudyRightsTable'
import { FullStudy } from '@/db/study'
import { EmissionFactorImportVersion, StudyRole } from '@prisma/client'
import { User } from 'next-auth'

interface Props {
  user: User
  study: FullStudy
  editionDisabled: boolean
  userRoleOnStudy: StudyRole
  emissionFactorSources: EmissionFactorImportVersion[]
}

const StudyRights = ({ user, study, editionDisabled, userRoleOnStudy, emissionFactorSources }: Props) => {
  return (
    <>
      <StudyParams user={user} study={study} disabled={editionDisabled} emissionFactorSources={emissionFactorSources} />

      <StudyRightsTable study={study} user={user} canAddMember={!editionDisabled} userRoleOnStudy={userRoleOnStudy} />
      <StudyContributorsTable study={study} canAddContributor={!editionDisabled} />
    </>
  )
}

export default StudyRights
