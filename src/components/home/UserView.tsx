import { environmentWithOnboarding } from '@/constants/environments'
import { getAccountOrganizationVersions } from '@/db/account'
import { OrganizationVersionWithOrganization } from '@/db/organization'
import { hasAccountToValidateInOrganization } from '@/db/user'
import { default as CUTLogosHome } from '@/environments/cut/home/LogosHome'
import { hasAccessToActualityCards } from '@/services/permissions/environment'
import { hasQualitylessEmissionFactors } from '@/services/serverFunctions/organization'
import { displayFeedBackForm } from '@/services/serverFunctions/user'
import { canEditMemberRole } from '@/utils/user'
import { UserSession } from 'next-auth'
import ActualitiesCards from '../actuality/ActualitiesCards'
import Onboarding from '../onboarding/Onboarding'
import StudiesContainer from '../study/StudiesContainer'
import CRClientsList from './CRClientsList'
import EmissionFactorsWarning from './EmissionFactorsWarning'
import UserFeedback from './UserFeedback'
import UserToValidate from './UserToValidate'

interface Props {
  account: UserSession
}

const UserView = async ({ account }: Props) => {
  const [organizationVersions, hasUserToValidate, displayFeedback, emissionFactorWarning] = await Promise.all([
    getAccountOrganizationVersions(account.accountId),
    hasAccountToValidateInOrganization(account.organizationVersionId),
    displayFeedBackForm(),
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
        <CRClientsList
          organizationVersions={
            organizationVersions.filter(
              (organizationVersion) => organizationVersion.id !== account.organizationVersionId,
            ) as OrganizationVersionWithOrganization[]
          }
          account={account}
        />
      )}
      <StudiesContainer user={account} isCR={isCR} />

      {hasAccessToActualityCards(account.environment) && <ActualitiesCards />}
      <CUTLogosHome user={account} />
      {userOrganizationVersion &&
        !userOrganizationVersion.onboarded &&
        environmentWithOnboarding.includes(userOrganizationVersion.environment) && (
          <Onboarding user={account} organizationVersion={userOrganizationVersion} />
        )}
      {displayFeedback.success && displayFeedback.data && <UserFeedback environment={account.environment} />}
      {emissionFactorWarning.success && !!emissionFactorWarning.data.length && (
        <EmissionFactorsWarning emissionFactors={emissionFactorWarning.data} />
      )}
    </>
  )
}

export default UserView
