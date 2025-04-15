import { getAccountOrganizationVersions } from '@/db/account'
import { OrganizationVersionWithOrganization } from '@/db/organization'
import { hasAccountToValidateInOrganization } from '@/db/user'
import { canEditMemberRole } from '@/utils/organization'
import { UserSession } from 'next-auth'
import Actualities from '../actuality/ActualitiesCards'
import Onboarding from '../onboarding/Onboarding'
import StudiesContainer from '../study/StudiesContainer'
import CRClientsList from './CRClientsList'
import UserToValidate from './UserToValidate'

interface Props {
  account: UserSession
}

const UserView = async ({ account }: Props) => {
  const [organizationVersions, hasUserToValidate] = await Promise.all([
    getAccountOrganizationVersions(account.id),
    hasAccountToValidateInOrganization(account.organizationVersionId),
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
        />
      )}
      <StudiesContainer user={account} isCR={isCR} />
      <Actualities />
      {userOrganizationVersion && !userOrganizationVersion.onboarded && (
        <Onboarding user={account} organizationVersion={userOrganizationVersion} />
      )}
    </>
  )
}

export default UserView
