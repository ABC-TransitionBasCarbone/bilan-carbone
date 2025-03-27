import { getAccountOrganizations } from '@/db/account'
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
  const [organizations, hasUserToValidate] = await Promise.all([
    getAccountOrganizations(account.id),
    hasAccountToValidateInOrganization(account.organizationId),
  ])

  const userOrganization = organizations.find((organization) => organization.id === account.organizationId)
  const isCR = userOrganization?.isCR

  return (
    <>
      {!!hasUserToValidate && canEditMemberRole(account) && (
        <div className="main-container mb1">
          <UserToValidate />
        </div>
      )}
      {isCR && (
        <CRClientsList
          organizations={organizations.filter((organization) => organization.id !== account.organizationId)}
        />
      )}
      <StudiesContainer user={account} isCR={isCR} />
      <Actualities />
      {userOrganization && !userOrganization.onboarded && (
        <Onboarding account={account} organization={userOrganization} />
      )}
    </>
  )
}

export default UserView
