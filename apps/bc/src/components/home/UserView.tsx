import { getAccountOrganizationVersions } from '@/db/account'
import { getProfessorCourseSessions } from '@/db/courseSession'
import { OrganizationVersionWithOrganization } from '@/db/organization'
import { hasAccountToValidateInOrganization } from '@/db/user'
import { hasQualitylessEmissionFactors } from '@/services/serverFunctions/organization'
import { canEditMemberRole } from '@/utils/user'
import { UserSession } from 'next-auth'
import StudiesContainer from '../study/StudiesContainer'
import EmissionFactorsWarning from './EmissionFactorsWarning'
import HomeCardsList from './HomeCardsList'
import UserToValidate from './UserToValidate'

interface Props {
  account: UserSession
}

const UserView = async ({ account }: Props) => {
  const sessions = await getProfessorCourseSessions(account)

  const [organizationVersions, hasUserToValidate, emissionFactorWarning] = await Promise.all([
    getAccountOrganizationVersions(account.accountId),
    hasAccountToValidateInOrganization(account.organizationVersionId),
    hasQualitylessEmissionFactors(),
  ])

  const userOrganizationVersion = organizationVersions.find(
    (organizationVersion) => organizationVersion.id === account.organizationVersionId,
  ) as OrganizationVersionWithOrganization
  const isCR = userOrganizationVersion?.isCR

  return (
    <>
      {!!hasUserToValidate && canEditMemberRole(account) && (
        <div className="main-container mb1">
          <UserToValidate />
        </div>
      )}
      {isCR && (
        <HomeCardsList
          type="clients"
          organizationVersions={
            organizationVersions.filter(
              (organizationVersion) => organizationVersion.id !== account.organizationVersionId,
            ) as OrganizationVersionWithOrganization[]
          }
          account={account}
        />
      )}
      {sessions.length > 0 && <HomeCardsList type="sessions" sessions={sessions} />}
      <StudiesContainer user={account} isCR={isCR} />

      {emissionFactorWarning.success && !!emissionFactorWarning.data.length && (
        <EmissionFactorsWarning emissionFactors={emissionFactorWarning.data} />
      )}
    </>
  )
}

export default UserView
